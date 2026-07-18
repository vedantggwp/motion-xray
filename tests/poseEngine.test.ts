import { describe, expect, it } from 'vitest';
import { LANDMARK_COUNT } from '../src/fixtures/schema';
import { poseResultToFrame } from '../src/live/poseEngine';
import { assertNoRawMedia, buildCapturedFixture } from '../src/live/buildFixture';
import { computeReceipt } from '../src/metrics/receipt';

function fakePose(seed = 0) {
  return Array.from({ length: LANDMARK_COUNT }, (_, index) => ({
    x: (index + seed) / 40,
    y: (index + seed) / 50,
    z: 0.01 * index,
    visibility: 0.9,
  }));
}

describe('pose result conversion seam', () => {
  it('converts MediaPipe-like results into MotionFrames with world landmarks', () => {
    const frame = poseResultToFrame(
      {
        landmarks: [fakePose(1)],
        worldLandmarks: [fakePose(2).map((landmark) => ({ ...landmark, x: landmark.x - 0.5 }))],
      },
      1234,
    );
    expect(frame).not.toBeNull();
    expect(frame!.timestampMs).toBe(1234);
    expect(frame!.landmarks).toHaveLength(LANDMARK_COUNT);
    expect(frame!.worldLandmarks).toHaveLength(LANDMARK_COUNT);
    expect(frame!.worldLandmarks![0].x).toBeCloseTo(2 / 40 - 0.5, 5);
  });

  it('returns null when no pose is present', () => {
    expect(poseResultToFrame({ landmarks: [] }, 0)).toBeNull();
    expect(
      poseResultToFrame({ landmarks: [fakePose().slice(0, 10)] }, 0),
    ).toBeNull();
  });

  it('builds live fixtures without raw pixels and keeps receipts media-free', () => {
    const frames = Array.from({ length: 40 }, (_, index) => ({
      timestampMs: index * 50,
      landmarks: fakePose(index),
      worldLandmarks: fakePose(index + 3),
    }));
    const fixture = buildCapturedFixture({
      frames,
      source: 'live-camera',
      label: 'unit capture',
    });
    expect(fixture.source).toBe('live-camera');
    expect(fixture.frames[0].timestampMs).toBe(0);
    expect(fixture.id.length).toBeGreaterThan(8);
    assertNoRawMedia(fixture);
    const receipt = computeReceipt(fixture);
    assertNoRawMedia(receipt);
    expect(receipt).not.toHaveProperty('pixels');
    expect(JSON.stringify(receipt)).not.toMatch(/blob:|data:image|data:video/);
  });
});
