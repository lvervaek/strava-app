# Stride Story

## Project Overview
React app that visualizes GPS activities (running, cycling) on a dark Mapbox map with animated playback. Users connect Strava or upload GPX files, then watch their tracks draw on the map with colored moving dots.

## Tech Stack
- React 18 (Create React App) with Context API (`src/context/AppContext.js`)
- Mapbox GL JS for map rendering
- React Bootstrap for UI components
- Strava API for activity imports
- No backend — runs entirely client-side

## Architecture
- **AppContext.js** — All shared state (animation, playback, export, onboarding, tracks)
- **MapContainer.js** — Mapbox init, animation loop (`requestAnimationFrame`), seek handler, color scheme updates. Exports `COLOR_SCHEMES`.
- **Sidebar.js** — Glassmorphism collapsible sidebar with accordion sections
- **sections/** — StravaSection, TracksSection (GPX upload), ControlsSection (play/pause/speed/timeline/colors), ExportSection, AboutSection
- **ExportOverlay.js** — Crop overlay for image export (hi-res via map resize) and WebM video recording (MediaRecorder API)
- **OnboardingOverlay.js** — 3-step guided tour for first-time users

## Key Patterns
- Animation uses refs (not state) to avoid re-renders: `tracksRef`, `elapsedRef`, `linesRef`, etc.
- Seek/scrub: `seekFraction` state triggers a useEffect that resets cursors, computes positions, renders one frame
- Hi-res image export: temporarily resize map container, zoom by `log2(scale)`, capture full canvas, restore
- Video export: resize map to crop area, auto-calculate playback speed, MediaRecorder with timer-based stop
- Color schemes applied via `map.setPaintProperty()` with `match` expressions on `activitytype`
- Map created with `preserveDrawingBuffer: true` for canvas export

## Environment
- Windows, Node.js in `C:\Program Files\nodejs\`
- Build: `npx react-scripts build`
- Mapbox token in `REACT_APP_MAPBOX_TOKEN` env var
- Strava credentials in `REACT_APP_STRAVA_CLIENT_ID` / `REACT_APP_STRAVA_CLIENT_SECRET`

## Implemented Features
- Strava OAuth login (popup flow) — fetches 75 activities, filters virtual rides
- GPX file upload with timestamp parsing
- Animated track playback with interpolation
- Play / Pause / Reset / Speed control (1-500x)
- Timeline scrubber (seek to any point)
- 4 color schemes (Arctic, Ember, Forest, Violet)
- Image export with crop overlay (1x/2x/4x resolution)
- WebM video recording (5-30s duration, auto-speed)
- 3-step onboarding tour with glassmorphism cards

## Discussed but Not Yet Implemented
- Share links via backend (Firebase/Supabase) to share visualizations by URL
- Copy to clipboard / native share sheet after export
