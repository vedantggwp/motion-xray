import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import type { Landmark, MotionFixture, MotionFrame } from '../src/fixtures/schema';
import { validateFixture } from '../src/fixtures/schema';
import { computeReceipt } from '../src/metrics/receipt';
import { countFrameGaps } from '../src/metrics/quality';

function cloneLandmark(landmark: Landmark): Landmark {
  return { ...landmark };
}

function withFrames(base: MotionFixture, frames: MotionFrame[]): MotionFixture {
  return validateFixture({
    ...base,
    id: `${base.id}-gaps`,
    frames,
  });
}

describe('material frame-gap quality reason', () => {
  it('does not reject for a single scheduling hiccup', () => {
    const fixture = validateFixture(accepted);
    const frames = fixture.frames.map((frame, index) => ({
      timestampMs: index === 10 ? frame.timestampMs + 250 : frame.timestampMs,
      landmarks: frame.landmarks.map(cloneLandmark),
    }));
    // Keep non-decreasing timestamps after the hiccup bump.
    for (let i = 11; i < frames.length; i += 1) {
      frames[i] = {
        timestampMs: Math.max(frames[i].timestampMs, frames[i - 1].timestampMs + 33),
        landmarks: frames[i].landmarks,
      };
    }

    const oneHiccup = withFrames(fixture, frames);
    expect(countFrameGaps(oneHiccup)).toBeGreaterThanOrEqual(1);
    const receipt = computeReceipt(oneHiccup);
    expect(receipt.quality.reasonCodes).not.toContain('material-frame-gaps');
  });

  it('adds material-frame-gaps when gaps are frequent and repeated', () => {
    const fixture = validateFixture(accepted);
    const frames = fixture.frames.map((frame, index) => ({
      timestampMs: index * 200,
      landmarks: frame.landmarks.map(cloneLandmark),
    }));

    const gappy = withFrames(fixture, frames);
    expect(countFrameGaps(gappy)).toBeGreaterThanOrEqual(2);
    const receipt = computeReceipt(gappy);
    expect(receipt.quality.frameGaps).toBe(countFrameGaps(gappy));
    expect(receipt.quality.reasonCodes).toContain('material-frame-gaps');
    expect(receipt.quality.grade).toBe('insufficient');
  });
});
