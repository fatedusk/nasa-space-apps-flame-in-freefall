# SpaceStation Guardian — orbital digital twin prototype

A React + Three.js educational simulation interface with an orbital station scene, Earth backdrop, selectable station areas, scenario controls, particle-based event visuals, and simplified environmental indicators.

## Run it

1. Install Node.js 20 or newer.
2. Open a terminal in `frontend/`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local Vite URL shown in the terminal.

## Add the uploaded ISS model

The supplied source model is in `assets/source-model/ISS_stationary.usdz`.

That file contains a binary USDC payload. Three.js's built-in USDZ loader does not currently support binary USDC in this format, so this starter does not pretend it can load the source USDZ directly. Convert it to GLB first:

- In Blender with USD import support, import `ISS_stationary.usdz`.
- Export the imported scene as `glTF 2.0` and choose the binary `.glb` format.
- Save the result as `frontend/public/models/iss.glb`.
- In the website, choose **Load GLB model** and select `iss.glb`.

Alternatively, NASA provides an official ISS glTF download on its ISS 3D Model resource page: https://science.nasa.gov/resource/international-space-station-3d-model/ .

Until a GLB is loaded, the app displays a procedural 3D station approximation so the interface remains usable.

## What the prototype does

- 3D orbital scene with Earth, stars, a station approximation, camera orbit and zoom.
- Selectable station-module list and emergency scenarios.
- Start, pause, replay, reset and time scaling.
- Animated visual event particles. Particle movement is integrated frame-by-frame using velocity, a simple drag term and a small visual drift term.
- Simplified educational pressure, temperature, oxygen partial-pressure and power indicators.

## Important limitations

This is a learning/demo prototype, not an engineering-grade spacecraft simulator. The event particles and expanding shell are visualisations, not computed explosive blast physics. It does not calculate explosive yield, blast overpressure, fragmentation, real debris trajectories, structural failure, or flight-qualified fire behaviour. The pressure/temperature/power equations are intentionally simplified illustrative trends, not validated ISS models. Values are simulated and are never live ISS telemetry.

The current module list is a UI selection list; the procedural fallback is not a dimensionally accurate ISS. For accurate module picking on the imported model, add named mesh metadata/hotspots after inspecting the GLB hierarchy.
