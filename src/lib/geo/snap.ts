import { RoadFeature, Coordinate, LineStringGeometry, MultiLineStringGeometry } from "@/types/road";
import { haversineDistanceMeters, calculateGeometryLengthMeters, calculateBoundingBox } from "./geometry";
import * as turf from "@turf/turf";

export type SnapMode = "b_to_a" | "a_to_b" | "midpoint";
export type EndpointPosition = "start" | "end";

export interface SnapEndpointPair {
  id: string;
  featureAId: string;
  featureAName: string;
  posA: EndpointPosition;
  coordA: Coordinate;

  featureBId: string;
  featureBName: string;
  posB: EndpointPosition;
  coordB: Coordinate;

  gapDistanceMeters: number;
  withinTolerance: boolean;
}

export interface SnapValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  deflectionDegA?: number;
  deflectionDegB?: number;
  hasSelfIntersectionA?: boolean;
  hasSelfIntersectionB?: boolean;
  hasUnintendedCrossIntersection?: boolean;
  snappedCoordA?: Coordinate;
  snappedCoordB?: Coordinate;
}

export interface SnapCandidate extends SnapEndpointPair {
  validation: Record<SnapMode, SnapValidationResult>;
}

/**
 * Calculates angle between two 2D vectors in degrees (0 to 180).
 */
function calculateDeflectionAngleDegrees(
  p: Coordinate,
  eOrig: Coordinate,
  eNew: Coordinate
): number {
  const v1x = eOrig[0] - p[0];
  const v1y = eOrig[1] - p[1];
  const v2x = eNew[0] - p[0];
  const v2y = eNew[1] - p[1];

  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 < 1e-9 || mag2 < 1e-9) return 0;

  const dot = v1x * v2x + v1y * v2y;
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

/**
 * Validates a single line for self-intersections using Turf.
 */
function checkSelfIntersection(coords: Coordinate[]): boolean {
  if (coords.length < 4) return false;
  try {
    const line = turf.lineString(coords);
    const kinks = turf.kinks(line);
    return kinks.features.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validates whether two lines cross each other at points other than their endpoints.
 */
function checkUnintendedCrossIntersection(
  coordsA: Coordinate[],
  coordsB: Coordinate[],
  intendedMeetingPoint: Coordinate
): boolean {
  try {
    const lineA = turf.lineString(coordsA);
    const lineB = turf.lineString(coordsB);
    const intersects = turf.lineIntersect(lineA, lineB);

    for (const pt of intersects.features) {
      const [ptLon, ptLat] = pt.geometry.coordinates;
      const distFromIntended = haversineDistanceMeters(
        [ptLon, ptLat],
        intendedMeetingPoint
      );
      // If intersection is more than 2 metres away from intended meeting point, it's unintended
      if (distFromIntended > 2) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Replaces the start or end coordinate of a coordinate array.
 */
function replaceEndpoint(
  coords: Coordinate[],
  pos: EndpointPosition,
  newCoord: Coordinate
): Coordinate[] {
  const result = coords.map((c) => [...c] as Coordinate);
  if (pos === "start") {
    result[0] = [...newCoord];
  } else {
    result[result.length - 1] = [...newCoord];
  }
  return result;
}

/**
 * Validates a proposed snap configuration.
 */
export function validateSnapProposal(
  featureA: RoadFeature,
  featureB: RoadFeature,
  posA: EndpointPosition,
  coordA: Coordinate,
  posB: EndpointPosition,
  coordB: Coordinate,
  gapDistanceMeters: number,
  toleranceMeters: number,
  mode: SnapMode
): SnapValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Tolerance check
  if (gapDistanceMeters > toleranceMeters) {
    errors.push(
      `Gap distance (${gapDistanceMeters.toFixed(1)}m) exceeds tolerance (${toleranceMeters}m)`
    );
  }

  // Determine target coordinates for A and B
  let targetCoordA: Coordinate;
  let targetCoordB: Coordinate;

  if (mode === "b_to_a") {
    targetCoordA = coordA;
    targetCoordB = coordA; // B moves to A
  } else if (mode === "a_to_b") {
    targetCoordA = coordB; // A moves to B
    targetCoordB = coordB;
  } else {
    const mid: Coordinate = [
      (coordA[0] + coordB[0]) / 2,
      (coordA[1] + coordB[1]) / 2,
    ];
    targetCoordA = mid;
    targetCoordB = mid;
  }

  const coordsA =
    featureA.geometry.type === "LineString"
      ? featureA.geometry.coordinates
      : featureA.geometry.coordinates[0];

  const coordsB =
    featureB.geometry.type === "LineString"
      ? featureB.geometry.coordinates
      : featureB.geometry.coordinates[0];

  // Zero-length terminal check for A
  if (mode === "a_to_b" || mode === "midpoint") {
    const penIndexA = posA === "start" ? 1 : coordsA.length - 2;
    const penA = coordsA[penIndexA];
    if (penA && targetCoordA[0] === penA[0] && targetCoordA[1] === penA[1]) {
      errors.push(`Snapping collapses terminal segment on ${featureA.name} to duplicate coordinates`);
    }
  }

  // Zero-length terminal check for B
  if (mode === "b_to_a" || mode === "midpoint") {
    const penIndexB = posB === "start" ? 1 : coordsB.length - 2;
    const penB = coordsB[penIndexB];
    if (penB && targetCoordB[0] === penB[0] && targetCoordB[1] === penB[1]) {
      errors.push(`Snapping collapses terminal segment on ${featureB.name} to duplicate coordinates`);
    }
  }

  // Alignment deflection check for A
  let deflectionDegA: number | undefined;
  if (mode === "a_to_b" || mode === "midpoint") {
    const penIndexA = posA === "start" ? 1 : coordsA.length - 2;
    const penA = coordsA[penIndexA];
    if (penA) {
      deflectionDegA = calculateDeflectionAngleDegrees(penA, coordA, targetCoordA);
      if (deflectionDegA > 45) {
        warnings.push(
          `Noticeable alignment deflection (${deflectionDegA.toFixed(1)}°) on ${featureA.name}`
        );
      }
    }
  }

  // Alignment deflection check for B
  let deflectionDegB: number | undefined;
  if (mode === "b_to_a" || mode === "midpoint") {
    const penIndexB = posB === "start" ? 1 : coordsB.length - 2;
    const penB = coordsB[penIndexB];
    if (penB) {
      deflectionDegB = calculateDeflectionAngleDegrees(penB, coordB, targetCoordB);
      if (deflectionDegB > 45) {
        warnings.push(
          `Noticeable alignment deflection (${deflectionDegB.toFixed(1)}°) on ${featureB.name}`
        );
      }
    }
  }

  // Proposed updated coordinates for geometry analysis
  const newCoordsA =
    mode === "b_to_a" ? coordsA : replaceEndpoint(coordsA, posA, targetCoordA);
  const newCoordsB =
    mode === "a_to_b" ? coordsB : replaceEndpoint(coordsB, posB, targetCoordB);

  // Self-intersection checks
  const hasSelfIntersectionA = checkSelfIntersection(newCoordsA);
  if (hasSelfIntersectionA) {
    warnings.push(`Snapping causes ${featureA.name} to intersect itself`);
  }

  const hasSelfIntersectionB = checkSelfIntersection(newCoordsB);
  if (hasSelfIntersectionB) {
    warnings.push(`Snapping causes ${featureB.name} to intersect itself`);
  }

  // Cross intersection check
  const meetingPoint = mode === "b_to_a" ? coordA : mode === "a_to_b" ? coordB : targetCoordA;
  const hasUnintendedCrossIntersection = checkUnintendedCrossIntersection(
    newCoordsA,
    newCoordsB,
    meetingPoint
  );

  if (hasUnintendedCrossIntersection) {
    warnings.push(
      `Snapping causes an unexpected crossing between ${featureA.name} and ${featureB.name}`
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    deflectionDegA,
    deflectionDegB,
    hasSelfIntersectionA,
    hasSelfIntersectionB,
    hasUnintendedCrossIntersection,
    snappedCoordA: targetCoordA,
    snappedCoordB: targetCoordB,
  };
}

/**
 * Finds all potential snap endpoint candidates between two features within tolerance.
 */
export function findSnapCandidates(
  featureA: RoadFeature,
  featureB: RoadFeature,
  toleranceMeters = 15
): SnapCandidate[] {
  const coordsA =
    featureA.geometry.type === "LineString"
      ? featureA.geometry.coordinates
      : featureA.geometry.coordinates[0];

  const coordsB =
    featureB.geometry.type === "LineString"
      ? featureB.geometry.coordinates
      : featureB.geometry.coordinates[0];

  if (!coordsA || coordsA.length < 2 || !coordsB || coordsB.length < 2) {
    return [];
  }

  const startA = coordsA[0];
  const endA = coordsA[coordsA.length - 1];

  const startB = coordsB[0];
  const endB = coordsB[coordsB.length - 1];

  const pairings: Array<{
    posA: EndpointPosition;
    coordA: Coordinate;
    posB: EndpointPosition;
    coordB: Coordinate;
  }> = [
    { posA: "end", coordA: endA, posB: "start", coordB: startB },
    { posA: "end", coordA: endA, posB: "end", coordB: endB },
    { posA: "start", coordA: startA, posB: "start", coordB: startB },
    { posA: "start", coordA: startA, posB: "end", coordB: endB },
  ];

  const candidates: SnapCandidate[] = [];
  const maxSearchDistance = Math.max(toleranceMeters * 5, 300);

  for (let i = 0; i < pairings.length; i++) {
    const p = pairings[i];
    const dist = haversineDistanceMeters(p.coordA, p.coordB);

    if (dist <= maxSearchDistance) {
      const withinTol = dist <= toleranceMeters;

      const modes: SnapMode[] = ["b_to_a", "a_to_b", "midpoint"];
      const validationMap = {} as Record<SnapMode, SnapValidationResult>;

      for (const mode of modes) {
        validationMap[mode] = validateSnapProposal(
          featureA,
          featureB,
          p.posA,
          p.coordA,
          p.posB,
          p.coordB,
          dist,
          toleranceMeters,
          mode
        );
      }

      candidates.push({
        id: `snap-${i}`,
        featureAId: featureA.id,
        featureAName: featureA.name,
        posA: p.posA,
        coordA: p.coordA,
        featureBId: featureB.id,
        featureBName: featureB.name,
        posB: p.posB,
        coordB: p.coordB,
        gapDistanceMeters: dist,
        withinTolerance: withinTol,
        validation: validationMap,
      });
    }
  }

  // Sort by gap distance ascending
  return candidates.sort((a, b) => a.gapDistanceMeters - b.gapDistanceMeters);
}

/**
 * Applies the snap operation to featureA and featureB.
 * Returns the updated features with revised coordinates and recalculated metrics.
 */
export function applySnap(
  featureA: RoadFeature,
  featureB: RoadFeature,
  candidate: SnapCandidate,
  mode: SnapMode
): { updatedFeatureA: RoadFeature; updatedFeatureB: RoadFeature } {
  const val = candidate.validation[mode];
  const targetCoordA = val.snappedCoordA || candidate.coordA;
  const targetCoordB = val.snappedCoordB || candidate.coordB;

  let newGeomA: LineStringGeometry | MultiLineStringGeometry;
  if (featureA.geometry.type === "LineString") {
    newGeomA = {
      type: "LineString",
      coordinates:
        mode === "b_to_a"
          ? featureA.geometry.coordinates
          : replaceEndpoint(featureA.geometry.coordinates, candidate.posA, targetCoordA),
    };
  } else {
    const lines = [...featureA.geometry.coordinates];
    if (mode !== "b_to_a") {
      lines[0] = replaceEndpoint(lines[0], candidate.posA, targetCoordA);
    }
    newGeomA = {
      type: "MultiLineString",
      coordinates: lines,
    };
  }

  let newGeomB: LineStringGeometry | MultiLineStringGeometry;
  if (featureB.geometry.type === "LineString") {
    newGeomB = {
      type: "LineString",
      coordinates:
        mode === "a_to_b"
          ? featureB.geometry.coordinates
          : replaceEndpoint(featureB.geometry.coordinates, candidate.posB, targetCoordB),
    };
  } else {
    const lines = [...featureB.geometry.coordinates];
    if (mode !== "a_to_b") {
      lines[0] = replaceEndpoint(lines[0], candidate.posB, targetCoordB);
    }
    newGeomB = {
      type: "MultiLineString",
      coordinates: lines,
    };
  }

  const getCoordCount = (geom: LineStringGeometry | MultiLineStringGeometry) => {
    if (geom.type === "LineString") return geom.coordinates.length;
    return geom.coordinates.reduce((sum, line) => sum + line.length, 0);
  };

  const getCompCount = (geom: LineStringGeometry | MultiLineStringGeometry) => {
    if (geom.type === "LineString") return 1;
    return geom.coordinates.length;
  };

  const lengthMetersA = calculateGeometryLengthMeters(newGeomA);
  const bboxA = calculateBoundingBox(newGeomA);

  const updatedFeatureA: RoadFeature = {
    ...featureA,
    geometry: newGeomA,
    metadata: {
      ...featureA.metadata,
      lengthMeters: lengthMetersA,
      coordinateCount: getCoordCount(newGeomA),
      componentCount: getCompCount(newGeomA),
      bbox: bboxA,
    },
  };

  const lengthMetersB = calculateGeometryLengthMeters(newGeomB);
  const bboxB = calculateBoundingBox(newGeomB);

  const updatedFeatureB: RoadFeature = {
    ...featureB,
    geometry: newGeomB,
    metadata: {
      ...featureB.metadata,
      lengthMeters: lengthMetersB,
      coordinateCount: getCoordCount(newGeomB),
      componentCount: getCompCount(newGeomB),
      bbox: bboxB,
    },
  };

  return { updatedFeatureA, updatedFeatureB };
}
