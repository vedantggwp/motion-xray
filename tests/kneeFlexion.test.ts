import { describe, expect, it } from 'vitest';
import type { Landmark, MotionFixture } from '../src/fixtures/schema';
import { LANDMARK_COUNT, validateFixture } from '../src/fixtures/schema';
import { copy } from '../src/copy/copy';
import {
  cameraPlaneKneeFlexionDeg,
  computeKneeFlexion,
} from '../src/metrics/kneeFlexion';
import { mirrorFixture } from '../src/metrics/mirror';
import { computeReceipt, formatReceiptDisplay } from '../src/metrics/receipt';

function blankLandmarks(): Landmark[] {
  return Array.from({ length: LANDMARK_COUNT }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));
}

function setLeg(
  landmarks: Landmark[],
  side: 'left' | 'right',
  hip: [number, number],
  knee: [number, number],
  ankle: [number, number],
): void {
  const hipIndex = side === 'left' ? 23 : 24;
  const kneeIndex = side === 'left' ? 25 : 26;
  const ankleIndex = side === 'left' ? 27 : 28;
  landmarks[hipIndex] = { x: hip[0], y: hip[1], z: 0, visibility: 0.95 };
  landmarks[kneeIndex] = { x: knee[0], y: knee[1], z: 0, visibility: 0.95 };
  landmarks[ankleIndex] = { x: ankle[0], y: ankle[1], z: 0, visibility: 0.95 };
}

describe('camera-plane knee flexion', () => {
  it('computes a known geometric angle', () => {
    const hip = { x: 0.4, y: 0.2, z: 0, visibility: 1 };
    const knee = { x: 0.4, y: 0.5, z: 0, visibility: 1 };
    const ankle = { x: 0.7, y: 0.5, z: 0, visibility: 1 };
    // Thigh straight down, shank straight right => 90°
    const angle = cameraPlaneKneeFlexionDeg(hip, knee, ankle);
    expect(angle).toBeCloseTo(90, 5);
  });

  it('mirrors left/right ranges on a geometric fixture', () => {
    const frames = Array.from({ length: 40 }, (_, index) => {
      const landmarks = blankLandmarks();
      const flex = index < 20 ? 0.0 : 0.25;
      setLeg(landmarks, 'left', [0.35, 0.25], [0.35, 0.5], [0.35 + flex, 0.75]);
      setLeg(landmarks, 'right', [0.65, 0.25], [0.65, 0.5], [0.65, 0.75]);
      return { timestampMs: index * 50, landmarks };
    });
    const fixture = validateFixture({
      id: 'knee-geo',
      label: 'knee geo',
      source: 'synthetic-fixture',
      fps: 20,
      frames,
    }) as MotionFixture;

    const original = computeKneeFlexion(fixture);
    const mirrored = computeKneeFlexion(mirrorFixture(fixture));
    expect(original.sufficient).toBe(true);
    expect(mirrored.left!.rangeDeg).toBeCloseTo(original.right!.rangeDeg, 5);
    expect(mirrored.right!.rangeDeg).toBeCloseTo(original.left!.rangeDeg, 5);
  });

  it('hides knee angles on abstention and insufficient evidence', () => {
    const frames = Array.from({ length: 20 }, (_, index) => ({
      timestampMs: index * 50,
      landmarks: blankLandmarks().map((landmark) => ({ ...landmark, visibility: 0.2 })),
    }));
    const fixture = validateFixture({
      id: 'knee-insufficient',
      label: 'knee insufficient',
      source: 'synthetic-fixture',
      fps: 20,
      frames,
    });
    const receipt = computeReceipt(fixture);
    expect(receipt.quality.grade).toBe('insufficient');
    const display = formatReceiptDisplay(receipt);
    expect(display.leftKneeRangeDeg).toBe(copy.timingNotReported);
    expect(display.rightKneeRangeDeg).toBe(copy.timingNotReported);
  });
});
