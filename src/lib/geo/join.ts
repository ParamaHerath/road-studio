import { RoadFeature, Coordinate, LineStringGeometry } from "@/types/road";
import { haversineDistanceMeters, calculateGeometryLengthMeters, calculateBoundingBox } from "./geometry";

export type EndpointPosition = "start" | "end";

export interface EndpointDescriptor {
  featureId: string;
  featureName: string;
  position: EndpointPosition;
  coordinate: Coordinate;
}

export interface JoinCandidate {
  id: string;
  endpointA: EndpointDescriptor;
  endpointB: EndpointDescriptor;
  gapDistanceMeters: number;
  needsReverseA: boolean;
  needsReverseB: boolean;
  isAmbiguous: boolean;
  ambiguityReason?: string;
}

/**
 * Finds all potential join pairings between two road features.
 * Identifies candidate connections, gap distance, required direction reversals,
 * and warns about ambiguous connections.
 */
export function findJoinCandidates(
  featureA: RoadFeature,
  featureB: RoadFeature,
  maxGapMeters = 200
): JoinCandidate[] {
  // Extract all continuous line components to check endpoints
  const linesA: Coordinate[][] =
    featureA.geometry.type === "LineString"
      ? [featureA.geometry.coordinates]
      : featureA.geometry.coordinates;

  const linesB: Coordinate[][] =
    featureB.geometry.type === "LineString"
      ? [featureB.geometry.coordinates]
      : featureB.geometry.coordinates;

  if (linesA.length === 0 || linesB.length === 0) {
    return [];
  }

  // Use the primary/outer endpoints of each feature
  const coordsA = linesA[0];
  const coordsB = linesB[0];

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
    needsReverseA: boolean;
    needsReverseB: boolean;
  }> = [
    // 1. A.end -> B.start: Direct sequential (no reversal)
    {
      posA: "end",
      coordA: endA,
      posB: "start",
      coordB: startB,
      needsReverseA: false,
      needsReverseB: false,
    },
    // 2. A.end -> B.end: Reverse B so B's end becomes start
    {
      posA: "end",
      coordA: endA,
      posB: "end",
      coordB: endB,
      needsReverseA: false,
      needsReverseB: true,
    },
    // 3. A.start -> B.start: Reverse A so A's start becomes end
    {
      posA: "start",
      coordA: startA,
      posB: "start",
      coordB: startB,
      needsReverseA: true,
      needsReverseB: false,
    },
    // 4. B.end -> A.start: Place B before A (or reverse both)
    {
      posA: "start",
      coordA: startA,
      posB: "end",
      coordB: endB,
      needsReverseA: true,
      needsReverseB: true,
    },
  ];

  const candidates: JoinCandidate[] = [];

  for (let i = 0; i < pairings.length; i++) {
    const p = pairings[i];
    const dist = haversineDistanceMeters(p.coordA, p.coordB);

    if (dist <= maxGapMeters) {
      candidates.push({
        id: `join-${i}`,
        endpointA: {
          featureId: featureA.id,
          featureName: featureA.name,
          position: p.posA,
          coordinate: p.coordA,
        },
        endpointB: {
          featureId: featureB.id,
          featureName: featureB.name,
          position: p.posB,
          coordinate: p.coordB,
        },
        gapDistanceMeters: dist,
        needsReverseA: p.needsReverseA,
        needsReverseB: p.needsReverseB,
        isAmbiguous: false,
      });
    }
  }

  // Sort by smallest gap distance first
  candidates.sort((a, b) => a.gapDistanceMeters - b.gapDistanceMeters);

  // Check for ambiguous branch: if two candidates have similar distance (within 15m)
  if (candidates.length >= 2) {
    const diff = Math.abs(candidates[0].gapDistanceMeters - candidates[1].gapDistanceMeters);
    if (diff < 15) {
      candidates[0].isAmbiguous = true;
      candidates[0].ambiguityReason =
        "Multiple potential endpoint pairings found with similar distance (possible roundabout or branch). Inspect direction carefully.";
      candidates[1].isAmbiguous = true;
      candidates[1].ambiguityReason =
        "Multiple potential endpoint pairings found with similar distance (possible roundabout or branch). Inspect direction carefully.";
    }
  }

  return candidates;
}

/**
 * Joins multiple road features into a single continuous LineString feature.
 * Direction-insensitive, finds closest matching endpoints iteratively, closes gaps, and stitches into one continuous LineString.
 */
export function bulkJoinFeatures(
  featuresToJoin: RoadFeature[],
  newName: string
): RoadFeature {
  if (featuresToJoin.length < 2) {
    throw new Error("At least 2 road features are required to join.");
  }

  // Extract all lines as arrays of coordinates
  const segments: Coordinate[][] = [];
  const sourceIds: string[] = [];
  const sourceDescriptions: string[] = [];

  for (const feat of featuresToJoin) {
    sourceIds.push(feat.id);
    if (feat.description) sourceDescriptions.push(feat.description);

    if (feat.geometry.type === "LineString") {
      segments.push([...feat.geometry.coordinates]);
    } else {
      for (const line of feat.geometry.coordinates) {
        segments.push([...line]);
      }
    }
  }

  if (segments.length === 0) {
    throw new Error("No coordinate segments available to join.");
  }

  // Start with the first segment
  let currentChain: Coordinate[] = [...segments[0]];
  const remaining = segments.slice(1);

  while (remaining.length > 0) {
    const chainStart = currentChain[0];
    const chainEnd = currentChain[currentChain.length - 1];

    let bestDist = Infinity;
    let bestIndex = -1;
    let attachToStart = false;
    let reverseSegment = false;

    for (let i = 0; i < remaining.length; i++) {
      const seg = remaining[i];
      const segStart = seg[0];
      const segEnd = seg[seg.length - 1];

      // 4 possible connections between chain endpoints and segment endpoints:
      // Option 1: chainEnd -> segStart
      const d1 = haversineDistanceMeters(chainEnd, segStart);
      if (d1 < bestDist) {
        bestDist = d1;
        bestIndex = i;
        attachToStart = false;
        reverseSegment = false;
      }

      // Option 2: chainEnd -> segEnd (reverse segment so segEnd meets chainEnd)
      const d2 = haversineDistanceMeters(chainEnd, segEnd);
      if (d2 < bestDist) {
        bestDist = d2;
        bestIndex = i;
        attachToStart = false;
        reverseSegment = true;
      }

      // Option 3: segEnd -> chainStart (prepend segment to start of chain)
      const d3 = haversineDistanceMeters(chainStart, segEnd);
      if (d3 < bestDist) {
        bestDist = d3;
        bestIndex = i;
        attachToStart = true;
        reverseSegment = false;
      }

      // Option 4: segStart -> chainStart (reverse segment then prepend)
      const d4 = haversineDistanceMeters(chainStart, segStart);
      if (d4 < bestDist) {
        bestDist = d4;
        bestIndex = i;
        attachToStart = true;
        reverseSegment = true;
      }
    }

    if (bestIndex === -1) break;

    const [chosen] = remaining.splice(bestIndex, 1);
    const oriented = reverseSegment ? [...chosen].reverse() : [...chosen];

    if (attachToStart) {
      // Connect oriented.end to chainStart:
      // If coincident (distance < 0.05m), avoid duplicate vertex
      const gap = haversineDistanceMeters(oriented[oriented.length - 1], chainStart);
      if (gap < 0.05) {
        currentChain = [...oriented.slice(0, -1), ...currentChain];
      } else {
        // Gap exists: direct line connects oriented.end -> chainStart
        currentChain = [...oriented, ...currentChain];
      }
    } else {
      // Connect chainEnd to oriented.start:
      const gap = haversineDistanceMeters(chainEnd, oriented[0]);
      if (gap < 0.05) {
        currentChain = [...currentChain, ...oriented.slice(1)];
      } else {
        // Gap exists: direct line connects chainEnd -> oriented.start
        currentChain = [...currentChain, ...oriented];
      }
    }
  }

  const geometry: LineStringGeometry = {
    type: "LineString",
    coordinates: currentChain,
  };

  const lengthMeters = calculateGeometryLengthMeters(geometry);
  const bbox = calculateBoundingBox(geometry);

  return {
    id: `joined-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: newName.trim() || `${featuresToJoin[0].name} (Joined)`,
    description: sourceDescriptions.length > 0 ? Array.from(new Set(sourceDescriptions)).join(" | ") : undefined,
    geometry,
    visible: true,
    properties: {
      joinedFromCount: featuresToJoin.length,
      joinedFromIds: sourceIds,
      bulkJoined: true,
    },
    metadata: {
      componentCount: 1,
      coordinateCount: currentChain.length,
      lengthMeters,
      bbox,
    },
  };
}

/**
 * Joins two compatible features into a single continuous LineString feature.
 * Reverses coordinate sequences where necessary and avoids duplicate endpoints.
 */
export function joinFeatures(
  featureA: RoadFeature,
  featureB: RoadFeature,
  candidate: JoinCandidate,
  newName: string
): RoadFeature {
  let coordsA =
    featureA.geometry.type === "LineString"
      ? [...featureA.geometry.coordinates]
      : [...featureA.geometry.coordinates[0]];

  let coordsB =
    featureB.geometry.type === "LineString"
      ? [...featureB.geometry.coordinates]
      : [...featureB.geometry.coordinates[0]];

  // Apply reversals
  if (candidate.needsReverseA) {
    coordsA = coordsA.reverse();
  }
  if (candidate.needsReverseB) {
    coordsB = coordsB.reverse();
  }

  // Ensure A connects to B: coordsA.end connects to coordsB.start
  // If endpoints are duplicate/coincident (distance < 0.05m), omit the first point of B to prevent duplicate vertex
  const endA = coordsA[coordsA.length - 1];
  const startB = coordsB[0];
  const gap = haversineDistanceMeters(endA, startB);

  const mergedCoordinates: Coordinate[] = [...coordsA];

  if (gap < 0.05) {
    // Endpoints are duplicate: append B without its duplicate start point
    mergedCoordinates.push(...coordsB.slice(1));
  } else {
    // Gap: connect directly across the gap into a continuous LineString
    mergedCoordinates.push(...coordsB);
  }

  const geometry: LineStringGeometry = {
    type: "LineString",
    coordinates: mergedCoordinates,
  };

  const lengthMeters = calculateGeometryLengthMeters(geometry);
  const bbox = calculateBoundingBox(geometry);

  const descriptions = [featureA.description, featureB.description].filter(
    (d): d is string => Boolean(d)
  );

  return {
    id: `joined-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: newName.trim() || `${featureA.name} (Joined)`,
    description: descriptions.length > 0 ? descriptions.join(" | ") : undefined,
    geometry,
    visible: true,
    properties: {
      joinedFrom: [featureA.id, featureB.id],
      originalGapMeters: candidate.gapDistanceMeters,
      reversedA: candidate.needsReverseA,
      reversedB: candidate.needsReverseB,
    },
    metadata: {
      componentCount: 1,
      coordinateCount: mergedCoordinates.length,
      lengthMeters,
      bbox,
    },
  };
}
