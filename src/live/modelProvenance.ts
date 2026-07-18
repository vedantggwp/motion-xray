/**
 * Bundled MediaPipe identity for Measurement receipt / public JSON export.
 * Model SHA-256 is of `public/models/pose_landmarker_full.task` (sha256sum).
 */
export const MEDIAPIPE_PACKAGE = '@mediapipe/tasks-vision';
export const MEDIAPIPE_PACKAGE_VERSION = '0.10.17';
export const POSE_LANDMARKER_MODEL_ID = 'pose_landmarker_full.task';
export const POSE_LANDMARKER_MODEL_SHA256 =
  '5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1';

export type ModelProvenance = {
  mediapipePackage: typeof MEDIAPIPE_PACKAGE;
  mediapipePackageVersion: typeof MEDIAPIPE_PACKAGE_VERSION;
  modelId: typeof POSE_LANDMARKER_MODEL_ID;
  modelSha256: typeof POSE_LANDMARKER_MODEL_SHA256;
};

export function modelProvenance(): ModelProvenance {
  return {
    mediapipePackage: MEDIAPIPE_PACKAGE,
    mediapipePackageVersion: MEDIAPIPE_PACKAGE_VERSION,
    modelId: POSE_LANDMARKER_MODEL_ID,
    modelSha256: POSE_LANDMARKER_MODEL_SHA256,
  };
}
