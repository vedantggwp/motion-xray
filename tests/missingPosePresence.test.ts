import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import type { Landmark, MotionFixture, MotionFrame } from '../src/fixtures/schema';
import { LANDMARK_COUNT, validateFixture } from '../src/fixtures/schema';
import { emptyPoseFrame } from '../src/live/poseEngine';
import { computeReceipt } from '../src/metrics/receipt';
import { posePresenceRate } from '../src/metrics/quality';

function cloneLandmark(landmark: Landmark): Landmark {
  return { ...landmark };
}

function withFrames(base: MotionFixture, frames: MotionFrame[]): MotionFixture {
  return validateFixture({
    ...base,
    id: `${base.id}-missing-pose`,
    frames,
  });
}

describe('missing pose samples in capture quality', () => {
  it('reports ~0.5 presence and abstains when half the samples lack pose', () => {
    const fixture = validateFixture(accepted);
    const frames: MotionFrame[] = fixture.frames.map((frame, index) => {
      if (index % 2 === 0) {
        return {
          timestampMs: frame.timestampMs,
          landmarks: frame.landmarks.map(cloneLandmark),
        };
      }
      return emptyPoseFrame(frame.timestampMs);
    });

    const halfMissing = withFrames(fixture, frames);
    const presence = posePresenceRate(halfMissing);
    expect(presence).toBeGreaterThan(0.45);
    expect(presence).toBeLessThan(0.55);

    const receipt = computeReceipt(halfMissing);
    expect(receipt.quality.posePresenceRate).toBeCloseTo(presence, 5);
    expect(receipt.quality.grade).toBe('insufficient');
    expect(receipt.quality.reasonCodes).toContain('missing-pose');
  });

  it('emptyPoseFrame is schema-valid with zero visibility', () => {
    const frame = emptyPoseFrame(1200);
    expect(frame.landmarks).toHaveLength(LANDMARK_COUNT);
    expect(frame.landmarks.every((landmark) => landmark.visibility === 0)).toBe(true);
    expect(frame.timestampMs).toBe(1200);
  });
});
