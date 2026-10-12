"use client";

import dynamic from "next/dynamic";
import type { LeafletRoadMapProps } from "./LeafletRoadMap";

export const MapCanvas = dynamic<LeafletRoadMapProps>(
  () => import("./LeafletRoadMap").then((mod) => mod.LeafletRoadMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black text-zinc-500">
        <span className="text-xs">Loading Map Canvas...</span>
      </div>
    ),
  }
);
