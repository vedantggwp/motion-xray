import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Landmark, MotionFixture, MotionFrame } from '../src/fixtures/schema';
import { LANDMARK_COUNT } from '../src/fixtures/schema';
import { validateFixture } from '../src/fixtures/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../src/fixtures');

const FPS = 30;
const DURATION_S = 12;
const FRAME_COUNT = FPS * DURATION_S;
const SEED = 20260718;

/** Mulberry32 — deterministic seeded PRNG. */
function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Synthetic lateral gait. MediaPipe-style normalized coords:
 * x rightward, y downward, z depth (smaller = closer).
 * Large heel Y = low heel (stance); small heel Y = lifted heel.
 * Event detection uses local maxima of the body-relative heel signal
 * (image Y down ⇒ low-heel extrema) above a percentile floor.
 */
function buildPose(
  tSec: number,
  rng: () => number,
  footVisibility: (index: number) => number,
): Landmark[] {
  const landmarks: Landmark[] = Array.from({ length: LANDMARK_COUNT }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  const walkX = 0.35 + ((tSec * 0.04) % 0.3);
  const sway = Math.sin(tSec * 2.1) * 0.01;

  // Left cycle slightly faster → shorter left intervals (subtle asymmetry).
  const leftPhase = tSec * (2 * Math.PI * 0.95);
  const rightPhase = tSec * (2 * Math.PI * 0.88);

  const leftHeelLift = Math.max(0, Math.sin(leftPhase)) * 0.08;
  const rightHeelLift = Math.max(0, Math.sin(rightPhase)) * 0.08;
  const leftStanceY = 0.88 - leftHeelLift;
  const rightStanceY = 0.88 - rightHeelLift;

  const jitter = () => (rng() - 0.5) * 0.006;

  const set = (i: number, x: number, y: number, z: number, visibility: number) => {
    landmarks[i] = {
      x: clamp(x + jitter(), 0, 1),
      y: clamp(y + jitter(), 0, 1),
      z: z + jitter() * 0.5,
      visibility: clamp(visibility, 0, 1),
    };
  };

  // Nose / face cluster
  set(0, walkX + sway, 0.22, -0.05, 0.98);
  set(1, walkX - 0.02, 0.2, -0.04, 0.9);
  set(2, walkX - 0.03, 0.21, -0.04, 0.9);
  set(3, walkX - 0.04, 0.22, -0.03, 0.88);
  set(4, walkX + 0.02, 0.2, -0.04, 0.9);
  set(5, walkX + 0.03, 0.21, -0.04, 0.9);
  set(6, walkX + 0.04, 0.22, -0.03, 0.88);
  set(7, walkX - 0.05, 0.23, -0.02, 0.85);
  set(8, walkX + 0.05, 0.23, -0.02, 0.85);
  set(9, walkX - 0.02, 0.26, -0.03, 0.9);
  set(10, walkX + 0.02, 0.26, -0.03, 0.9);

  // Shoulders / elbows / wrists
  set(11, walkX - 0.08, 0.34, 0, 0.97);
  set(12, walkX + 0.08, 0.34, 0, 0.97);
  set(13, walkX - 0.12, 0.48 + Math.sin(leftPhase) * 0.02, 0.02, 0.95);
  set(14, walkX + 0.12, 0.48 + Math.sin(rightPhase) * 0.02, 0.02, 0.95);
  set(15, walkX - 0.14, 0.6 + Math.sin(leftPhase) * 0.03, 0.04, 0.93);
  set(16, walkX + 0.14, 0.6 + Math.sin(rightPhase) * 0.03, 0.04, 0.93);

  // Hands
  for (let i = 17; i <= 22; i += 1) {
    const leftish = i % 2 === 1;
    set(
      i,
      walkX + (leftish ? -0.15 : 0.15),
      0.62 + Math.sin(leftish ? leftPhase : rightPhase) * 0.02,
      0.05,
      0.9,
    );
  }

  // Hips / knees
  set(23, walkX - 0.05, 0.58, 0.01, 0.97);
  set(24, walkX + 0.05, 0.58, 0.01, 0.97);
  set(25, walkX - 0.05 + Math.sin(leftPhase) * 0.02, 0.74 - leftHeelLift * 0.4, 0.02, 0.96);
  set(26, walkX + 0.05 + Math.sin(rightPhase) * 0.02, 0.74 - rightHeelLift * 0.4, 0.02, 0.96);

  // Ankles / heels / foot index
  set(27, walkX - 0.04 + Math.sin(leftPhase) * 0.03, leftStanceY - 0.01, 0.03, footVisibility(27));
  set(28, walkX + 0.04 + Math.sin(rightPhase) * 0.03, rightStanceY - 0.01, 0.03, footVisibility(28));
  set(29, walkX - 0.05 + Math.sin(leftPhase) * 0.03, leftStanceY, 0.04, footVisibility(29));
  set(30, walkX + 0.05 + Math.sin(rightPhase) * 0.03, rightStanceY, 0.04, footVisibility(30));
  set(31, walkX - 0.03 + Math.sin(leftPhase) * 0.035, leftStanceY - 0.005, 0.05, footVisibility(31));
  set(32, walkX + 0.03 + Math.sin(rightPhase) * 0.035, rightStanceY - 0.005, 0.05, footVisibility(32));

  return landmarks;
}

function generateFrames(
  seed: number,
  footVisibility: (index: number) => number,
): MotionFrame[] {
  const rng = createRng(seed);
  const frames: MotionFrame[] = [];
  for (let i = 0; i < FRAME_COUNT; i += 1) {
    const timestampMs = Math.round((i / FPS) * 1000);
    const tSec = i / FPS;
    frames.push({
      timestampMs,
      landmarks: buildPose(tSec, rng, footVisibility),
    });
  }
  return frames;
}

function writeFixture(fixture: MotionFixture, filename: string): void {
  validateFixture(fixture);
  const path = join(OUT_DIR, filename);
  writeFileSync(path, `${JSON.stringify(fixture)}\n`, 'utf8');
  console.log(`Wrote ${path} (${fixture.frames.length} frames)`);
}

mkdirSync(OUT_DIR, { recursive: true });

const acceptedVisRng = createRng(SEED + 1);
const accepted: MotionFixture = {
  id: 'accepted-walk',
  label: 'Accepted lateral walk',
  source: 'synthetic-fixture',
  fps: FPS,
  frames: generateFrames(SEED, () => 0.92 + acceptedVisRng() * 0.06),
};

const poorRng = createRng(SEED + 99);
const insufficient: MotionFixture = {
  id: 'insufficient-evidence',
  label: 'Insufficient foot evidence',
  source: 'synthetic-fixture',
  fps: FPS,
  frames: generateFrames(SEED, (index) => {
    if (index >= 27 && index <= 32) {
      return 0.15 + poorRng() * 0.1; // 0.15–0.25
    }
    return 0.92;
  }),
};

writeFixture(accepted, 'accepted-walk.json');
writeFixture(insufficient, 'insufficient-evidence.json');
