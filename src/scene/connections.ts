/**
 * Display rig uses a clean subset of the 33 source landmarks.
 * Face and finger detail clusters stay in fixture data but are not rendered.
 */
export const DISPLAY_JOINT_INDICES = [
  0, // head / nose
  11,
  12, // shoulders
  13,
  14, // elbows
  15,
  16, // wrists
  23,
  24, // hips
  25,
  26, // knees
  27,
  28, // ankles
  29,
  30, // heels
  31,
  32, // toe points
] as const;

export const HEAD_JOINT_INDEX = 0;

/** Minimal procedural rods for the display subset. */
export const DISPLAY_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 11],
  [0, 12],
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32],
] as const;

/** @deprecated Use DISPLAY_CONNECTIONS — kept name alias for readability in trails. */
export const POSE_CONNECTIONS = DISPLAY_CONNECTIONS;

export const LEFT_TRAIL_INDICES = [27, 29] as const;
export const RIGHT_TRAIL_INDICES = [28, 30] as const;

export function landmarkToWorld(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  // Map normalized image coords into a readable three-quarter stage volume.
  return [(x - 0.5) * 2.4, (0.5 - y) * 2.6, -z * 1.2];
}

/**
 * Centre/scale MediaPipe hip-origin world landmarks (metres) for display.
 * Does not pretend these form a personalised anatomical model.
 */
export function worldLandmarkToDisplay(
  x: number,
  y: number,
  z: number,
  scale = 1.8,
): [number, number, number] {
  // MediaPipe world: y typically up; flip to match stage Y-up after image-space convention.
  return [x * scale, -y * scale, -z * scale];
}

export function landmarksForDisplay(frame: {
  landmarks: { x: number; y: number; z: number; visibility: number }[];
  worldLandmarks?: { x: number; y: number; z: number; visibility: number }[];
}): {
  points: { x: number; y: number; z: number; visibility: number }[];
  space: 'normalized-image' | 'world-metres';
} {
  if (frame.worldLandmarks && frame.worldLandmarks.length === 33) {
    return {
      points: frame.worldLandmarks.map((landmark) => {
        const [x, y, z] = worldLandmarkToDisplay(landmark.x, landmark.y, landmark.z);
        return { x, y, z, visibility: landmark.visibility };
      }),
      space: 'world-metres',
    };
  }
  return {
    points: frame.landmarks.map((landmark) => {
      const [x, y, z] = landmarkToWorld(landmark.x, landmark.y, landmark.z);
      return { x, y, z, visibility: landmark.visibility };
    }),
    space: 'normalized-image',
  };
}

/** Prefer hip-origin world metres when present; otherwise normalized image mapping. */
export function displayPoint(
  frame: {
    landmarks: { x: number; y: number; z: number; visibility: number }[];
    worldLandmarks?: { x: number; y: number; z: number; visibility: number }[];
  },
  index: number,
): { x: number; y: number; z: number; visibility: number } {
  const world = frame.worldLandmarks?.[index];
  if (world) {
    const [x, y, z] = worldLandmarkToDisplay(world.x, world.y, world.z);
    return { x, y, z, visibility: world.visibility };
  }
  const landmark = frame.landmarks[index];
  const [x, y, z] = landmarkToWorld(landmark.x, landmark.y, landmark.z);
  return { x, y, z, visibility: landmark.visibility };
}

/** Approximate vertical centre of the display figure in world units. */
export function estimateBodyCentreY(frame: {
  landmarks: { x: number; y: number; z: number; visibility: number }[];
  worldLandmarks?: { x: number; y: number; z: number; visibility: number }[];
}): number {
  if (frame.landmarks.length < 33) {
    return -0.1;
  }
  const head = displayPoint(frame, 0);
  const leftHeel = displayPoint(frame, 29);
  const rightHeel = displayPoint(frame, 30);
  return (head.y + (leftHeel.y + rightHeel.y) / 2) / 2;
}
