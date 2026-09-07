# Chimp Atlas

A minimal, interactive 3D skeleton explorer for the common chimpanzee (*Pan troglodytes*), built with React, Three.js, and Vinext.

## Features

- Orbit and zoom around a complete CT-derived chimpanzee skeleton.
- Focus the camera on the skull, rib cage, pelvis, or lower limbs.
- Switch between three-quarter, front, side, and back views.
- Automatic rotation, reset controls, and a responsive interface.

The original specimen's turned head and bent legs are preserved. The scan is a continuous surface, not individually segmented bones: region controls focus the camera, and an exploded-bone slider is not implemented.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server.

```sh
npm run build
npm start
```

The production build targets Cloudflare Workers through Vinext. The existing `.openai/hosting.json` belongs to the original Sites deployment; configure your own hosting project before deploying a fork. No API keys are required to view the skeleton locally.

## Project structure

- `app/page.tsx`: interface and viewer controls.
- `app/skeleton-scene.tsx`: Three.js scene, model loading, and camera behavior.
- `app/skeleton-state.ts`: region targets and view configuration.
- `public/models/`: optimized skeleton geometry and its manifest.

## Credits

The skeleton is adapted from **CT Based Adult Common Chimp Skeleton** by **VISIBLE APE PROJECT**, licensed under **CC BY 4.0**. The interface draws on [Human Atlas](https://github.com/ashemag/human-atlas), licensed under MIT. Human skeletal geometry is not used.

See [the full attribution and adaptation notes](public/ATTRIBUTION.md) and [the Human Atlas MIT notice](public/licenses/human-atlas-MIT.txt). Third-party assets and dependencies retain their respective licenses.
