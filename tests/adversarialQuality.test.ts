import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import type { Landmark, MotionFixture, MotionFrame } from '../src/fixtures/schema';
import { LANDMARK_COUNT, validateFixture } from '../src/fixtures/schema';
import { copy } from '../src/copy/copy';
import {
  canSurfaceTiming,
  computeReceipt,
  formatReceiptDisplay,
} from '../src/metrics/receipt';

function cloneLandmark(landmark: Landmark): Landmark {
  return { ...landmark };
}

function makeLandmark(seed: number, visibility = 0.95): Landmark {
  const n = seed * 0.017;
  return {
    x: (Math.sin(n) + 1) / 2,
    y: (Math.cos(n * 1.3) + 1) / 2,
    z: Math.sin(n * 0.7) * 0.2,
    visibility,
  };
}

function withFrames(base: MotionFixture, frames: MotionFrame[]): MotionFixture {
  return validateFixture({
    ...base,
    id: `${base.id}-adversarial`,
    frames,
  });
}

/** Deterministic shuffle of landmark payloads while keeping timestamps ordered. */
function shuffleLandmarksKeepTimestamps(fixture: MotionFixture): MotionFixture {
  const payloads = fixture.frames.map((frame) => frame.landmarks.map(cloneLandmark));
  for (let i = payloads.length - 1; i > 0; i -= 1) {
    const j = (i * 9301 + 49297) % (i + 1);
    const tmp = payloads[i];
    payloads[i] = payloads[j];
    payloads[j] = tmp;
  }
  return withFrames(
    fixture,
    fixture.frames.map((frame, index) => ({
      timestampMs: frame.timestampMs,
      landmarks: payloads[index],
    })),
  );
}

describe('adversarial capture quality gates', () => {
  it('abstains on deterministically shuffled accepted frames with ordered timestamps', () => {
    const fixture = validateFixture(accepted);
    expect(computeReceipt(fixture).quality.grade).toBe('accepted');

    const shuffled = shuffleLandmarksKeepTimestamps(fixture);
    const receipt = computeReceipt(shuffled);
    expect(receipt.quality.grade).toBe('insufficient');
    expect(receipt.quality.reasonCodes).toContain('temporal-discontinuity');
    expect(canSurfaceTiming(receipt)).toBe(false);
    expect(formatReceiptDisplay(receipt).leftMedianMs).toBe(copy.timingNotReported);
    expect(formatReceiptDisplay(receipt).deltaMs).toBe(copy.timingNotReported);
  });

  it('abstains on constant pose', () => {
    const fixture = validateFixture(accepted);
    const constantLandmarks = fixture.frames[0].landmarks.map(cloneLandmark);
    const frames = fixture.frames.map((frame) => ({
      timestampMs: frame.timestampMs,
      landmarks: constantLandmarks.map(cloneLandmark),
    }));
    const receipt = computeReceipt(withFrames(fixture, frames));
    expect(receipt.quality.grade).toBe('insufficient');
    expect(canSurfaceTiming(receipt)).toBe(false);
    expect(formatReceiptDisplay(receipt).rightMedianMs).toBe(copy.timingNotReported);
  });

  it('abstains on random high-visibility landmarks', () => {
    const fixture = validateFixture(accepted);
    const frames = fixture.frames.map((frame, frameIndex) => ({
      timestampMs: frame.timestampMs,
      landmarks: Array.from({ length: LANDMARK_COUNT }, (_, landmarkIndex) =>
        makeLandmark(frameIndex * 33 + landmarkIndex, 0.98),
      ),
    }));
    const receipt = computeReceipt(withFrames(fixture, frames));
    expect(receipt.quality.grade).toBe('insufficient');
    expect(canSurfaceTiming(receipt)).toBe(false);
  });

  it('abstains on truncated capture', () => {
    const fixture = validateFixture(accepted);
    const frames = fixture.frames.slice(0, 45).map((frame) => ({
      timestampMs: frame.timestampMs,
      landmarks: frame.landmarks.map(cloneLandmark),
    }));
    const receipt = computeReceipt(withFrames(fixture, frames));
    expect(receipt.quality.grade).toBe('insufficient');
    expect(receipt.quality.reasonCodes).toContain('capture-too-short');
    expect(formatReceiptDisplay(receipt).deltaPct).toBe(copy.timingNotReported);
  });
});
