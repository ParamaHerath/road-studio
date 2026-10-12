# Road Studio — KML Road Network Editor

**Road Studio** is a desktop-first web application engineered for manually reviewing, selecting, combining, and editing road paths imported from KML files.

Its primary mission is facilitating the redesign of geographic road networks (such as Sri Lanka's A-class highway network) for fantasy and real-world road cartography. It gives cartographers and GIS practitioners full control over individual road segments, bypasses, roundabouts, junctions, branches, and disconnected sections without altering underlying geographic accuracy.

---

## 1. Features

- **Accurate KML Ingestion & GeoJSON Conversion**: Imports single and multipart line features (`LineString`, `MultiLineString`) while strictly preserving coordinates, feature names, descriptions, and metadata.
- **Interactive Leaflet GIS Canvas**: High-performance geographic canvas with high-contrast road styling, hover states, and endpoint markers.
- **Tri-Mode Map Canvas**:
  - **Standard Road Map**: OpenStreetMap tiles with complete attribution.
  - **Minimal Grid Mode**: High-contrast, distraction-free coordinate canvas with subtle square-grid alignment without tile servers.
  - **Configurable Satellite Imagery**: Privacy-respecting tile provider slot without hardcoded proprietary API keys.
- **Precision Operations (Combine, Join, Snap)**:
  - **Combine**: Groups disconnected or branch segments into a single named multipart road feature without drawing artificial connector geometry.
  - **Join**: Inspects and connects candidate endpoints with gap distance calculated in metres, coordinate direction reversal, and ambiguity warnings.
  - **Snap**: Explicit endpoint snapping within user-defined tolerances with visual preview and verification.
- **Robust Snapshot & Command Undo/Redo**: Reversible geometry and metadata edits.
- **Road Naming & Inspection**: Rename paths to standard highway designations (e.g., A1, A2, A3), inspect vertex counts, lengths, and sub-components.
- **Google Earth Pro-Compliant KML Export**: Serializes clean KML with coordinate fidelity, multipart placemark preservation, and full round-trip integrity.
- **Local Client-Side Persistence**: Browser-local IndexedDB storage for state preservation across reloads without transmitting geographic data to external servers.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **Language**: TypeScript (strict type checking)
- **Styling**: Tailwind CSS 4 & Vanilla CSS tokens
- **UI & Icons**: Accessible primitives & Lucide Icons
- **Mapping Canvas**: Leaflet & React Leaflet
- **GIS Geometry**: Turf.js (`@turf/turf`) & `@tmcw/togeojson`
- **State Management**: Zustand
- **Local Persistence**: IndexedDB via `idb`
- **Testing**: Vitest, React Testing Library, and Playwright

---

## 3. Getting Started

### Prerequisites

- **Node.js**: v20 or later (v24 LTS recommended)
- **npm**: v10 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/ParamaHerath/road-studio.git
cd road-studio

# Install dependencies
npm install
```

---

## 4. Development & Verification Commands

| Command | Description |
|---|---|
| `npm run dev` | Launch the development server on `http://localhost:3000` |
| `npm run build` | Build the optimized production bundle |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint across the source code |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm run test` | Run Vitest unit and component test suite |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run test:e2e` | Run Playwright end-to-end test suite |

---

## 5. Operations Guide

### Combine vs Join vs Snap

- **Combine**: Select two or more features and merge them under one road name. Coordinate lists are preserved as separate line pieces in a `MultiLineString`. Disconnected segments are never artificially bridged.
- **Join**: Connects compatible endpoints into a single continuous `LineString`. Reverses point sequence when heading opposite directions, reports the gap distance in metres, and requires confirmation.
- **Snap**: Adjusts endpoints within a tight tolerance (e.g. 5–25 metres) to eliminate floating gaps while warning of unintended intersections.
- **Undo / Redo**: `Ctrl+Z` / `Ctrl+Y` or toolbar buttons restore previous geometry, selection, and naming state.

---

## 6. KML Compatibility & Limitations

- **Supported Features**: `LineString`, `MultiLineString`, named Placemarks, `<ExtendedData>`, standard coordinates (`longitude,latitude,altitude`).
- **Initial Limitations**: Network links (`<NetworkLink>`), ground overlays (`<GroundOverlay>`), 3D polygon extrusions, and Google Earth-specific flyover camera tours are safely reported and bypassed to preserve line network data integrity.

---

## 7. Data Privacy & Map Attribution

- **100% Client-Side**: All KML parsing, geometry calculations, and project sessions are processed purely in your browser. No geometry or metadata is sent to any remote server.
- **Map Attribution**: OpenStreetMap standard tiles are used under the Open Database License (ODbL) with credit to `© OpenStreetMap contributors`.

---

## 8. Current Development Status

- **Milestone 1 — Project Foundation**: ✅ Completed (Next.js 16, React 19, Tailwind CSS 4, UI shell, Vitest, Playwright, Zustand store).
- **Milestone 2 — KML Import & Data Model**: ✅ Completed (KML parser, domain types, summary cards, drag-and-drop modal, 13 parser & edge fixture tests).
- **Milestone 3 — Map Canvas & Path List**: ✅ Completed (Leaflet interactive GIS map, high-contrast polyline styling, tooltips, list sync, search, locate on map, tri-mode background).
- **Milestone 4 — Combine & Rename**: ✅ Completed (Multipart combination preserving disconnected pieces, road designation modal, duplicate warning, snapshot undo/redo & keyboard shortcuts).
- **Milestone 5 — Endpoint Inspection & Join**: ✅ Completed (Candidate endpoint inspection, distance display in metres, direction reversal, ambiguous-connection warnings, continuous join).
- **Milestone 6 — Snap & Geometry Validation**: ✅ Completed (Configurable tolerance 1–100m, original vs proposed coordinate inspection, target modes, deflection and unintended intersection validation, applySnap).
- **Milestone 7 — KML Export & Round-Trip Verification**: ✅ Completed (Export full project or selected/visible scope, LineString & MultiGeometry placemark preservation, Google Earth Pro compatibility, ExtendedData metrics, export-import round-trip validation).
- **Milestone 8 — Persistence & Recovery**: ✅ Completed (IndexedDB client-side storage, debounced auto-save, reload session restoration, NewProjectModal destructive reset confirmation).
- **Milestone 9 — Polish & Acceptance Testing**: Next in sequence.
