"use client";

import * as React from "react";
import L from "leaflet";
import { RoadFeature, BoundingBox } from "@/types/road";
import { TileBackgroundMode } from "@/store/editorStore";

export interface LeafletRoadMapProps {
  features: RoadFeature[];
  selectedFeatureIds: Set<string>;
  backgroundMode: TileBackgroundMode;
  focusedFeatureId?: string | null;
  onSelectFeature?: (id: string) => void;
  satelliteTileUrl?: string;
}

export const ROAD_COLORS = {
  // Default unselected road path color
  default: "#166534",
  // Hover road path color
  hover: "#16a34a",
  // Selected road path color
  selected: "#00f",
  // Segment endpoint bounds dot color
  endpointDot: "#fff",
} as const;

export function LeafletRoadMap({
  features,
  selectedFeatureIds,
  backgroundMode,
  focusedFeatureId,
  onSelectFeature,
  satelliteTileUrl,
}: LeafletRoadMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const tileLayerRef = React.useRef<L.TileLayer | null>(null);
  const featureGroupRef = React.useRef<L.FeatureGroup | null>(null);
  const polylineMapRef = React.useRef<Map<string, L.Polyline>>(new Map());
  const endpointDotsGroupRef = React.useRef<L.FeatureGroup | null>(null);
  const selectedFeatureIdsRef = React.useRef(selectedFeatureIds);
  selectedFeatureIdsRef.current = selectedFeatureIds;

  // Initialize Leaflet Map
  React.useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center on Sri Lanka: [7.8731, 80.7718], zoom 8
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718],
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });

    mapInstanceRef.current = map;

    const featureGroup = L.featureGroup().addTo(map);
    featureGroupRef.current = featureGroup;

    const dotsGroup = L.featureGroup().addTo(map);
    endpointDotsGroupRef.current = dotsGroup;

    // Invalidate size after layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Tile Layer according to backgroundMode
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layer if any
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (backgroundMode === "osm") {
      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = osmLayer;
    } else if (backgroundMode === "satellite" && satelliteTileUrl) {
      const satLayer = L.tileLayer(satelliteTileUrl, {
        attribution: "Custom Satellite Tiles",
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = satLayer;
    }
  }, [backgroundMode, satelliteTileUrl]);

  // Handle Map Resizing when sidebar toggles
  React.useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };

    window.addEventListener("resize", handleResize);
    const interval = setTimeout(handleResize, 200);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(interval);
    };
  }, []);

  // Render Features & Endpoint Bounds Dots on Map: re-creates layers when features or onSelectFeature change
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const group = featureGroupRef.current;
    const dotsGroup = endpointDotsGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (dotsGroup) dotsGroup.clearLayers();
    polylineMapRef.current.clear();

    const visibleFeatures = features.filter((f) => f.visible);
    if (visibleFeatures.length === 0) return;

    visibleFeatures.forEach((feat) => {
      const isSelected = selectedFeatureIdsRef.current.has(feat.id);

      // LatLng sequence for Leaflet: [lat, lon]
      const toLatLng = (c: [number, number] | [number, number, number]): [number, number] => [
        c[1],
        c[0],
      ];

      const latLngs =
        feat.geometry.type === "LineString"
          ? feat.geometry.coordinates.map(toLatLng)
          : feat.geometry.coordinates.map((line) => line.map(toLatLng));

      const polyline = L.polyline(latLngs, {
        color: isSelected ? ROAD_COLORS.selected : ROAD_COLORS.default,
        weight: 3.5,
        opacity: isSelected ? 1.0 : 0.85,
        lineCap: "round",
        lineJoin: "round",
      });

      // Hover and Click events
      polyline.on("mouseover", () => {
        if (!selectedFeatureIdsRef.current.has(feat.id)) {
          polyline.setStyle({
            color: ROAD_COLORS.hover,
            weight: 3.5,
            opacity: 1,
          });
        }
      });

      polyline.on("mouseout", () => {
        if (!selectedFeatureIdsRef.current.has(feat.id)) {
          polyline.setStyle({
            color: ROAD_COLORS.default,
            weight: 3.5,
            opacity: 0.85,
          });
        }
      });

      polyline.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectFeature) {
          onSelectFeature(feat.id);
        }
      });

      // Accessible tooltip with road info
      const lengthKm = (feat.metadata.lengthMeters / 1000).toFixed(1);
      polyline.bindTooltip(
        `<div class="text-xs">
          <strong>${feat.name || "Unnamed Road"}</strong><br/>
          <span class="text-slate-400">${feat.metadata.coordinateCount} vertices • ${lengthKm} km</span>
        </div>`,
        { sticky: true, className: "custom-road-tooltip" }
      );

      group.addLayer(polyline);
      polylineMapRef.current.set(feat.id, polyline);

      // Add tiny dots marking the start & end boundaries of each individual segment
      if (dotsGroup) {
        const lines =
          feat.geometry.type === "LineString"
            ? [feat.geometry.coordinates]
            : feat.geometry.coordinates;

        lines.forEach((line) => {
          if (line.length >= 2) {
            const startPt = toLatLng(line[0]);
            const endPt = toLatLng(line[line.length - 1]);

            [startPt, endPt].forEach((pt) => {
              const dot = L.circleMarker(pt, {
                radius: 3,
                color: ROAD_COLORS.default,
                weight: 1.5,
                fillColor: ROAD_COLORS.endpointDot,
                fillOpacity: 0.9,
                interactive: false,
              });
              dotsGroup.addLayer(dot);
            });
          }
        });
      }
    });
  }, [features, onSelectFeature]);

  // Update styles in-place when selection changes without rebuilding all SVG polylines
  React.useEffect(() => {
    polylineMapRef.current.forEach((polyline, id) => {
      const isSelected = selectedFeatureIds.has(id);
      polyline.setStyle({
        color: isSelected ? ROAD_COLORS.selected : ROAD_COLORS.default,
        weight: 3.5,
        opacity: isSelected ? 1.0 : 0.85,
      });
    });
  }, [selectedFeatureIds]);

  // Fit bounds when features first load or change
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const group = featureGroupRef.current;
    if (!map || !group || features.length === 0) return;

    try {
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } catch {
      // Ignore initial layout bounds calculation errors
    }
  }, [features.length]);

  // Fit to specific focused feature (when user clicks locate on map in list)
  React.useEffect(() => {
    if (!focusedFeatureId) return;
    const feat = features.find((f) => f.id === focusedFeatureId);
    const map = mapInstanceRef.current;
    if (!feat || !map) return;

    const bbox: BoundingBox = feat.metadata.bbox;
    // Bbox is [minLon, minLat, maxLon, maxLat]
    const bounds = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    }
  }, [focusedFeatureId, features]);

  return (
    <div
      ref={mapContainerRef}
      className={`h-full w-full ${backgroundMode === "minimal" ? "canvas-grid" : ""}`}
      data-testid="leaflet-map-container"
    />
  );
}
