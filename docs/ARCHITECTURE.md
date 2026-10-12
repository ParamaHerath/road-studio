# Road Studio — Technical Architecture & Geometry Decisions

## 1. Overview & Principles

**Road Studio** is an offline-capable, client-side web application for reviewing, combining, inspecting, and editing geographic road networks imported from KML files.

The design adheres to four foundational engineering principles:

1. **Absolute Coordinate Fidelity**: Real-world road paths are never approximated, flattened, or artificially connected unless explicitly commanded by the cartographer.
2. **100% Client-Side Privacy**: Geographic data is processed and persisted exclusively within the user's browser (IndexedDB). No coordinate or network data is sent to external servers.
3. **Reversible Operations**: Every geometry and metadata mutation (combine, join, snap, rename) is recorded in a snapshot-based history enabling complete undo and redo (`Ctrl+Z` / `Ctrl+Y`).
4. **Google Earth Pro & GIS Interoperability**: Ingestion and export round-trips conform strictly to OGC KML 2.2 and GeoJSON specifications.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Road Studio UI Layer                       │
│   ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐   │
│   │  TopToolbar  │   │  LeftSidebar  │   │ PropertiesPanel  │   │
│   └──────────────┘   └───────────────┘   └──────────────────┘   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │    MapCanvas (SSR-Safe Leaflet GIS Canvas & Overlays)   │   │
│   └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                   State & Undo/Redo Engine                      │
│                  (Zustand store: editorStore)                   │
│   - Feature Collection       - Selection Set                    │
│   - Active Tool State        - History Snapshots (Past/Future)  │
└───────┬────────────────────────┬────────────────────────┬───────┘
        │                        │                        │
┌───────▼──────────────┐ ┌───────▼──────────────┐ ┌───────▼───────┐
│  KML Ingestion &     │ │  GIS Geometry Core   │ │ Local Storage │
│  Export Pipeline     │ │  (Turf.js + Geo Math)│ │ (IndexedDB)   │
│  - parser.ts         │ │  - geometry.ts       │ │ - projectDb.ts│
│  - serializer.ts     │ │  - combine.ts        │ └───────────────┘
│  - fixtures.ts       │ │  - join.ts           │
└──────────────────────┘ │  - snap.ts           │
                         └──────────────────────┘
```

---

## 3. Geometry Operations & Decision Records

### 3.1 Combine (Multipart Grouping)
- **Problem**: In cartography, a single highway designation (e.g. A1, A2) often consists of distinct segments, branches, or bypasses. Forcing them into a single continuous polyline would invent synthetic connector lines across open land.
- **Decision**: Combining preserves each segment as an independent line within a GeoJSON `MultiLineString` and an OGC KML `<MultiGeometry>`.
- **Integrity Guarantee**: Coordinates are never modified during combine. Disconnected geometries remain completely disconnected.

### 3.2 Join (Sequential Continuity)
- **Problem**: Two adjacent road segments meeting near an intersection or endpoint should be concatenated into a single continuous `LineString`. However, segments in KML files frequently have opposing coordinate orders (e.g., both digitized from south to north, or one reversed).
- **Decision**:
  - `findJoinCandidates` examines all 4 endpoint pairings:
    1. A.end -> B.start (sequential, no reversal)
    2. A.end -> B.end (B reversed)
    3. A.start -> B.start (A reversed)
    4. A.start -> B.end (both reversed / B prepended)
  - The gap distance is calculated in metres using the Great-Circle Haversine formula.
  - Ambiguous connections (when multiple endpoints are near the same junction) trigger visual warnings.
  - Joining requires explicit confirmation in `JoinModal`.

### 3.3 Snap (Precision Alignment & Geometry Validation)
- **Problem**: Road segments digitized in different layers often have small gaps (e.g., 2–15 metres). Cartographers need to snap them together while guarding against unintended distortion or intersection.
- **Decision**:
  - Configurable tolerance in metres (default 15m, configurable 1–100m).
  - Three target modes:
    1. **Move B to A**: Moves B's endpoint to A; A is untouched.
    2. **Move A to B**: Moves A's endpoint to B; B is untouched.
    3. **Snap to Midpoint**: Moves both to the geographic midpoint.
  - **Geometry Validation Checks**:
    - **Tolerance check**: Flags candidates exceeding user tolerance.
    - **Alignment deflection check**: Computes vector angle change on the terminal segment. If $\theta > 45^\circ$, warns: *"Noticeable alignment deflection"*.
    - **Duplicate coordinate check**: Prevents zero-length collapsed terminal segments.
    - **Unintended intersection check**: Uses Turf.js (`kinks` and `lineIntersect`) to verify the modified segment does not cross itself or cut through the other road.

---

## 4. Coordinate System & Projection Conventions

| Context | Coordinate Order | Format |
|---|---|---|
| OGC KML 2.2 | `[longitude, latitude, altitude]` | `<coordinates>lon,lat,alt ...</coordinates>` |
| GeoJSON & Turf.js | `[longitude, latitude]` | `[number, number]` |
| Leaflet & React-Leaflet | `[latitude, longitude]` | `[lat, lon]` (inverted on render) |

---

## 5. Local Session Persistence

Session data is stored in the browser using IndexedDB database `road-studio-storage` (`idb`):
- **Debounced Auto-Save**: Changes to features or selections trigger a debounced save after 600ms.
- **Restore on Mount**: On page reload, the latest session is restored seamlessly without user intervention.
- **Destructive Action Protection**: Starting a new project prompts the user with `NewProjectModal`, clearly reporting the number of features and total network length to be wiped.
