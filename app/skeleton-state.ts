export const regions = [
  {
    id: 'whole',
    name: 'Whole skeleton',
    caption: 'Adult common chimpanzee',
    center: [0, 1.15, 0],
    height: 2.3,
    width: 1.08,
  },
  {
    id: 'skull',
    name: 'Skull',
    caption: 'Cranium & mandible',
    center: [-0.15, 2.07, 0.01],
    height: 0.66,
    width: 0.63,
  },
  {
    id: 'thorax',
    name: 'Rib cage',
    caption: 'Ribs & thoracic spine',
    center: [0.06, 1.51, -0.09],
    height: 1.04,
    width: 0.91,
  },
  {
    id: 'pelvis',
    name: 'Pelvis',
    caption: 'Pelvic region',
    center: [0.09, 0.95, -0.16],
    height: 0.61,
    width: 0.7,
  },
  {
    id: 'legs',
    name: 'Lower limbs',
    caption: 'Legs & feet',
    center: [0, 0.47, 0.01],
    height: 1.15,
    width: 1.12,
  },
] as const;
export type RegionId = (typeof regions)[number]['id'];
export type View = 'three-quarter' | 'front' | 'side' | 'back';
export const muscleModels = [
  {
    id: 'muscles-head',
    name: 'Head & neck',
    caption: 'Head & neck · muscle reconstruction',
  },
  {
    id: 'muscles-lower',
    name: 'Lower limb',
    caption: 'Lower limb · muscle reconstruction',
  },
] as const;
export type ModelId = 'skeleton' | (typeof muscleModels)[number]['id'];
export type SceneState = {
  model: ModelId;
  region: RegionId;
  view: View;
  rotate: boolean;
  reset: number;
  zoom: number;
};
export const initialState: SceneState = {
  model: 'skeleton',
  region: 'whole',
  view: 'three-quarter',
  rotate: false,
  reset: 0,
  zoom: 0,
};
export const cameraDirections: Record<View, readonly number[]> = {
  'three-quarter': [-0.72, 0.09, 1],
  front: [0, 0, 1],
  side: [-1, 0, 0],
  back: [0, 0, -1],
};
export function cameraDistance(
  height: number,
  width: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  const safeHeight = Math.max(
    100,
    viewportHeight - (viewportWidth < 768 ? 260 : 220),
  );
  const vertical =
    ((height / (2 * Math.tan((32 * Math.PI) / 360))) * viewportHeight) /
    safeHeight;
  const horizontal =
    (width /
      (2 * Math.tan((32 * Math.PI) / 360) * (viewportWidth / viewportHeight))) *
    1.3;
  return Math.max(vertical, horizontal) * 1.04;
}
