import { describe, expect, it } from 'vitest';
import { buildForkDisplayModel } from '../src/metrics/fork';
import type { Landmark } from '../src/fixtures/schema';
import { DISPLAY_CONNECTIONS, landmarkToWorld } from '../src/scene/connections';
import { buildGhostForkPositions } from '../src/scene/GhostFork';

describe('fork display model', () => {
  it('leaves the observed right interval at 0.0 and reaches the left reference at 1.0', () => {
    const left = 1053;
    const right = 1136;

    const atZero = buildForkDisplayModel(left, right, 0);
    expect(atZero.observedMs).toBe(right);
    expect(atZero.currentMs).toBe(right);
    expect(atZero.leftReferenceMs).toBe(left);

    const atOne = buildForkDisplayModel(left, right, 1);
    expect(atOne.observedMs).toBe(right);
    expect(atOne.currentMs).toBe(left);
    expect(atOne.leftReferenceMs).toBe(left);

    const mid = buildForkDisplayModel(left, right, 0.5);
    expect(mid.currentMs).toBeCloseTo((left + right) / 2, 5);
  });
});

describe('ghost fork LineSegments positions', () => {
  function visibleLandmarks(): Landmark[] {
    return Array.from({ length: 33 }, (_, i) => ({
      x: 0.2 + (i % 5) * 0.1,
      y: 0.2 + Math.floor(i / 5) * 0.1,
      z: 0.01 * i,
      visibility: 1,
    }));
  }

  it('emits independent start/end pairs per DISPLAY_CONNECTIONS edge', () => {
    const landmarks = visibleLandmarks();
    const positions = buildGhostForkPositions(landmarks);

    // Two vertices × three floats per connection — never a continuous Line polyline.
    expect(positions.length).toBe(DISPLAY_CONNECTIONS.length * 6);
    expect(positions.length % 6).toBe(0);

    for (let i = 0; i < DISPLAY_CONNECTIONS.length; i += 1) {
      const [a, b] = DISPLAY_CONNECTIONS[i];
      const [ax, ay, az] = landmarkToWorld(landmarks[a].x, landmarks[a].y, landmarks[a].z);
      const [bx, by, bz] = landmarkToWorld(landmarks[b].x, landmarks[b].y, landmarks[b].z);
      const base = i * 6;
      expect(positions[base]).toBeCloseTo(ax, 5);
      expect(positions[base + 1]).toBeCloseTo(ay, 5);
      expect(positions[base + 2]).toBeCloseTo(az, 5);
      expect(positions[base + 3]).toBeCloseTo(bx, 5);
      expect(positions[base + 4]).toBeCloseTo(by, 5);
      expect(positions[base + 5]).toBeCloseTo(bz, 5);
    }
  });

  it('skips a connection when either landmark is below the visibility gate', () => {
    const landmarks = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0,
    }));
    const [a, b] = DISPLAY_CONNECTIONS[5];
    landmarks[a] = { x: 0.3, y: 0.3, z: 0.01, visibility: 1 };
    landmarks[b] = { x: 0.4, y: 0.4, z: 0.02, visibility: 1 };

    expect(buildGhostForkPositions(landmarks).length).toBe(6);

    landmarks[a] = { ...landmarks[a], visibility: 0.2 };
    expect(buildGhostForkPositions(landmarks).length).toBe(0);
  });
});
