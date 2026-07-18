/** Shared capture-protocol constants (Sports2D-inspired discipline, browser-local). */

/** Visible framing settle time before the existing countdown (solo demo). */
export const CAMERA_FRAMING_MS = 2000;
export const CAMERA_COUNTDOWN_MS = 3000;
export const CAMERA_RECORD_MS = 10_000;
export const MIN_CAPTURE_DURATION_MS = 6000;

/** Target analysed frames/second; do not queue backlog work. */
export const TARGET_ANALYSIS_FPS = 20;
export const MIN_ANALYSIS_INTERVAL_MS = 1000 / TARGET_ANALYSIS_FPS;

export const FILE_MAX_DURATION_MS = 15_000;
export const FILE_MAX_FRAMES = 450;
export const FILE_ANALYSIS_FPS = 20;

export const CAPTURE_PROTOCOL = [
  'Stable side view — person moves roughly parallel to the image plane.',
  'One person only, full body in frame.',
  'Both feet must stay visible for the whole clip.',
] as const;
