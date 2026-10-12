/**
 * Geographic Coordinate tuple: [longitude, latitude] or [longitude, latitude, altitude]
 * In accordance with GeoJSON / GIS standards, X is longitude and Y is latitude.
 */
export type Coordinate = [number, number] | [number, number, number];

export type BoundingBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export interface LineStringGeometry {
  type: "LineString";
  coordinates: Coordinate[];
}

export interface MultiLineStringGeometry {
  type: "MultiLineString";
  coordinates: Coordinate[][];
}

export type RoadGeometry = LineStringGeometry | MultiLineStringGeometry;

export interface RoadFeatureMetadata {
  componentCount: number;
  coordinateCount: number;
  lengthMeters: number;
  bbox: BoundingBox;
}

export interface RoadFeature {
  id: string;
  name: string;
  description?: string;
  geometry: RoadGeometry;
  visible: boolean;
  properties: Record<string, unknown>;
  originalKmlId?: string;
  metadata: RoadFeatureMetadata;
}

export interface ImportSummary {
  filename: string;
  featureCount: number;
  lineComponentCount: number;
  coordinateCount: number;
  totalLengthMeters: number;
  unsupportedCount: number;
  unsupportedTypes: string[];
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  features: RoadFeature[];
  summary: ImportSummary;
  error?: string;
  rawKml?: string;
}
