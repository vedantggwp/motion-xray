import type { Landmark, MotionFixture, MotionFrame } from '../fixtures/schema';
import { LANDMARK_COUNT, LEFT_RIGHT_PAIRS } from '../fixtures/schema';

function swapLandmarkIdentities(landmarks: Landmark[]): Landmark[] {
  const swapped = landmarks.map((landmark) => ({ ...landmark }));
  for (const [left, right] of LEFT_RIGHT_PAIRS) {
    const tmp = swapped[left];
    swapped[left] = swapped[right];
    swapped[right] = tmp;
  }
  return swapped;
}

export function mirrorFixture(fixture: MotionFixture): MotionFixture {
  const frames: MotionFrame[] = fixture.frames.map((frame) => {
    if (frame.landmarks.length !== LANDMARK_COUNT) {
      throw new Error('Cannot mirror fixture with incomplete landmarks');
    }
    const mirroredCoords = frame.landmarks.map((landmark) => ({
      x: 1 - landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
    }));
    const mirrored: MotionFrame = {
      timestampMs: frame.timestampMs,
      landmarks: swapLandmarkIdentities(mirroredCoords),
    };
    if (frame.worldLandmarks && frame.worldLandmarks.length === LANDMARK_COUNT) {
      const mirroredWorld = frame.worldLandmarks.map((landmark) => ({
        x: -landmark.x,
        y: landmark.y,
        z: landmark.z,
        visibility: landmark.visibility,
      }));
      mirrored.worldLandmarks = swapLandmarkIdentities(mirroredWorld);
    }
    return mirrored;
  });

  return {
    ...fixture,
    id: `${fixture.id}-mirrored`,
    label: `${fixture.label} (mirrored)`,
    frames,
  };
}
