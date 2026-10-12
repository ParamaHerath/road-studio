import { Coordinate, BoundingBox, RoadGeometry } from "@/types/road";

const EARTH_RADIUS_METERS = 6371008.8;

/**
 * Calculates Great-Circle distance in metres between two geographic coordinates
 * using the Haversine formula.
 */
export function haversineDistanceMeters(coord1: Coordinate, coord2: Coordinate): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates total length in metres of a sequence of coordinates.
 */
export function lineStringLengthMeters(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistanceMeters(coords[i], coords[i + 1]);
  }
  return total;
}

/**
 * Calculates total length in metres of a RoadGeometry.
 */
export function calculateGeometryLengthMeters(geometry: RoadGeometry): number {
  if (geometry.type === "LineString") {
    return lineStringLengthMeters(geometry.coordinates);
  }
  return geometry.coordinates.reduce((sum, line) => sum + lineStringLengthMeters(line), 0);
}

/**
 * Calculates bounding box [minLon, minLat, maxLon, maxLat] of coordinates.
 */
export function calculateBoundingBox(geometry: RoadGeometry): BoundingBox {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const processCoord = (coord: Coordinate) => {
    const [lon, lat] = coord;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  if (geometry.type === "LineString") {
    geometry.coordinates.forEach(processCoord);
  } else {
    geometry.coordinates.forEach((line) => line.forEach(processCoord));
  }

  if (minLon === Infinity) {
    return [0, 0, 0, 0];
  }

  return [minLon, minLat, maxLon, maxLat];
}

/**
 * Safely sanitizes arbitrary untrusted string from KML (removes HTML tags, decodes entities, trims).
 * Never injects raw HTML into the DOM.
 */
export function sanitizeKmlText(raw?: string | null): string {
  if (!raw) return "";
  // Strip XML/HTML tags
  const stripped = raw.replace(/<[^>]*>?/gm, " ");
  // Collapse whitespace
  return stripped.replace(/\s+/g, " ").trim();
}
