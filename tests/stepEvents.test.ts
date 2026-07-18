import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import type { Landmark, MotionFixture, MotionFrame } from '../src/fixtures/schema';
import {
  LANDMARK_COUNT,
  LEFT_ANKLE,
  LEFT_HEEL,
  LEFT_HIP,
  RIGHT_ANKLE,
  RIGHT_HEEL,
  RIGHT_HIP,
  validateFixture,
} from '../src/fixtures/schema';
import { emptyPoseFrame } from '../src/live/poseEngine';
import { computeReceipt } from '../src/metrics/receipt';
import { detectStepEvents, percentile } from '../src/metrics/stepEvents';

/** Fixture generators use 0.95 Hz left / 0.88 Hz right heel cycles over 12 s. */
const LEFT_PERIOD_MS = 1000 / 0.95;
const RIGHT_PERIOD_MS = 1000 / 0.88;

function cloneLandmark(landmark: Landmark): Landmark {
  return { ...landmark };
}

function withFrames(base: MotionFixture, frames: MotionFrame[]): MotionFixture {
  return validateFixture({
    ...base,
    id: `${base.id}-signal`,
    frames,
  });
}

function acceptedTimestamps(fixture: MotionFixture): number[] {
  return detectStepEvents(fixture)
    .filter((event) => event.accepted)
    .map((event) => event.timestampMs);
}

function blankLandmarks(visibility = 0.95): Landmark[] {
  return Array.from({ length: LANDMARK_COUNT }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility,
  }));
}

/**
 * Periodic body-relative heel walk whose peak amplitude decays over the capture.
 * Later local maxima sit below a global 80%-of-range band, so the old entry-crossing
 * rule under-counts, while percentile local-maxima detection still recovers cycles.
 */
function buildAmplitudeDriftFixture(): MotionFixture {
  const fps = 30;
  const durationS = 12;
  const frameCount = fps * durationS;
  const leftHz = 0.95;
  const rightHz = 0.88;
  const hipY = 0.58;
  const baseRel = 0.28;
  const amp0 = 0.07;
  const decay = 0.55; // late peaks ≈ 45% of early amplitude

  const frames: MotionFrame[] = [];
  for (let i = 0; i < frameCount; i += 1) {
    const tSec = i / fps;
    const progress = i / (frameCount - 1);
    const amp = amp0 * (1 - decay * progress);
    const leftRel = baseRel + amp * Math.cos(2 * Math.PI * leftHz * tSec);
    const rightRel = baseRel + amp * Math.cos(2 * Math.PI * rightHz * tSec + Math.PI);
    const leftHeelY = hipY + leftRel;
    const rightHeelY = hipY + rightRel;
    const landmarks = blankLandmarks(0.96);
    landmarks[LEFT_HIP] = { x: 0.45, y: hipY, z: 0.01, visibility: 0.97 };
    landmarks[RIGHT_HIP] = { x: 0.55, y: hipY, z: 0.01, visibility: 0.97 };
    landmarks[LEFT_HEEL] = { x: 0.44, y: leftHeelY, z: 0.04, visibility: 0.95 };
    landmarks[RIGHT_HEEL] = { x: 0.56, y: rightHeelY, z: 0.04, visibility: 0.95 };
    landmarks[LEFT_ANKLE] = { x: 0.44, y: leftHeelY - 0.01, z: 0.03, visibility: 0.95 };
    landmarks[RIGHT_ANKLE] = { x: 0.56, y: rightHeelY - 0.01, z: 0.03, visibility: 0.95 };
    // Knees / foot index keep pose-presence and foot-visibility gates happy.
    landmarks[25] = { x: 0.44, y: hipY + leftRel * 0.55, z: 0.02, visibility: 0.95 };
    landmarks[26] = { x: 0.56, y: hipY + rightRel * 0.55, z: 0.02, visibility: 0.95 };
    landmarks[31] = { x: 0.43, y: leftHeelY - 0.005, z: 0.05, visibility: 0.94 };
    landmarks[32] = { x: 0.57, y: rightHeelY - 0.005, z: 0.05, visibility: 0.94 };
    frames.push({
      timestampMs: Math.round((i / fps) * 1000),
      landmarks,
    });
  }

  return validateFixture({
    id: 'accepted-walk-amplitude-drift',
    label: 'Amplitude-drift lateral walk',
    source: 'synthetic-fixture',
    fps,
    frames,
  });
}

/**
 * One-sided heel series with a long rising approach then a clear peak.
 * After the detector's radius-2 smooth, the local max remains at index 12;
 * a threshold-entry rule would fire earlier on the rising edge.
 */
function buildSinglePeakFixture(): MotionFixture {
  const fps = 30;
  // Sharp isolated peak at index 12; surrounding samples stay lower after smoothing.
  const values = [
    0.1, 0.11, 0.12, 0.14, 0.18, 0.24, 0.32, 0.4, 0.48, 0.54, 0.58, 0.6, // 0–11 rising
    0.72, // 12 — intended low-heel extremum
    0.6, 0.52, 0.42, 0.32, 0.24, 0.18, 0.14, 0.12, 0.11, 0.1,
  ];
  const hipY = 0.5;
  const frames: MotionFrame[] = values.map((rel, i) => {
    const landmarks = blankLandmarks(0.96);
    const heelY = hipY + rel;
    landmarks[LEFT_HIP] = { x: 0.45, y: hipY, z: 0, visibility: 0.97 };
    landmarks[RIGHT_HIP] = { x: 0.55, y: hipY, z: 0, visibility: 0.97 };
    landmarks[LEFT_HEEL] = { x: 0.44, y: heelY, z: 0, visibility: 0.95 };
    landmarks[LEFT_ANKLE] = { x: 0.44, y: heelY - 0.01, z: 0, visibility: 0.95 };
    // Keep right side flat so it does not compete.
    landmarks[RIGHT_HEEL] = { x: 0.56, y: hipY + 0.1, z: 0, visibility: 0.95 };
    landmarks[RIGHT_ANKLE] = { x: 0.56, y: hipY + 0.09, z: 0, visibility: 0.95 };
    landmarks[31] = { x: 0.43, y: heelY, z: 0, visibility: 0.94 };
    landmarks[32] = { x: 0.57, y: hipY + 0.1, z: 0, visibility: 0.94 };
    return {
      timestampMs: Math.round((i / fps) * 1000),
      landmarks,
    };
  });

  return validateFixture({
    id: 'accepted-walk-single-peak',
    label: 'Single-peak timing probe',
    source: 'synthetic-fixture',
    fps,
    frames,
  });
}

/** Body-relative left-heel series matching the detector's pelvis mid-hip reference. */
function leftBodyRelativeSeries(fixture: MotionFixture): number[] {
  return fixture.frames.map((frame) => {
    const hipY = (frame.landmarks[LEFT_HIP].y + frame.landmarks[RIGHT_HIP].y) / 2;
    return frame.landmarks[LEFT_HEEL].y - hipY;
  });
}

/** Mirror of the detector's centered moving-average smooth (radius 2, no nulls). */
function smoothSeries(values: number[], radius: number): number[] {
  return values.map((_, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length - 1, index + radius);
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      sum += values[i];
      count += 1;
    }
    return sum / count;
  });
}

describe('heel-low event proxy on accepted fixture', () => {
  it('yields a sane deterministic event count near one per synthetic cycle', () => {
    const fixture = validateFixture(accepted);
    const events = detectStepEvents(fixture);
    const acceptedEvents = events.filter((event) => event.accepted);
    const left = acceptedEvents.filter((event) => event.side === 'left');
    const right = acceptedEvents.filter((event) => event.side === 'right');

    // ~0.95 Hz × 12 s ≈ 11 left; ~0.88 Hz × 12 s ≈ 11 right — not dozens.
    expect(left.length).toBeGreaterThanOrEqual(8);
    expect(left.length).toBeLessThanOrEqual(14);
    expect(right.length).toBeGreaterThanOrEqual(8);
    expect(right.length).toBeLessThanOrEqual(14);
    expect(acceptedEvents.length).toBeLessThan(30);

    const receipt = computeReceipt(fixture);
    expect(receipt.quality.grade).toBe('accepted');
    expect(receipt.quality.acceptedCount).toBe(acceptedEvents.length);
  });

  it('keeps same-side median intervals near the fixture cycle periods', () => {
    const receipt = computeReceipt(validateFixture(accepted));
    expect(receipt.left.medianMs).toBeGreaterThan(LEFT_PERIOD_MS * 0.85);
    expect(receipt.left.medianMs).toBeLessThan(LEFT_PERIOD_MS * 1.15);
    expect(receipt.right.medianMs).toBeGreaterThan(RIGHT_PERIOD_MS * 0.85);
    expect(receipt.right.medianMs).toBeLessThan(RIGHT_PERIOD_MS * 1.15);
  });

  it('is stable under smooth global vertical translation of every landmark', () => {
    const fixture = validateFixture(accepted);
    const baseline = computeReceipt(fixture);
    expect(baseline.quality.grade).toBe('accepted');
    const baselineTimes = acceptedTimestamps(fixture);

    const dy = 0.18;
    const translated = withFrames(
      fixture,
      fixture.frames.map((frame) => ({
        timestampMs: frame.timestampMs,
        landmarks: frame.landmarks.map((landmark) => ({
          ...cloneLandmark(landmark),
          y: landmark.y + dy,
        })),
      })),
    );
    const translatedReceipt = computeReceipt(translated);
    const translatedTimes = acceptedTimestamps(translated);

    expect(translatedReceipt.quality.grade).toBe('accepted');
    expect(translatedTimes).toHaveLength(baselineTimes.length);
    expect(translatedTimes).toEqual(baselineTimes);
    expect(translatedReceipt.quality.acceptedCount).toBe(baseline.quality.acceptedCount);
  });

  it('does not let a few zero-visibility placeholders erase supported events', () => {
    const fixture = validateFixture(accepted);
    const baseline = computeReceipt(fixture);
    expect(baseline.quality.grade).toBe('accepted');
    const baselineAccepted = baseline.quality.acceptedCount;

    // Sparse interior placeholders (schema-valid zero-visibility), not 50% missing.
    const poisonedFrames = fixture.frames.map((frame, index) => {
      if (index > 0 && index < fixture.frames.length - 1 && index % 40 === 0) {
        return emptyPoseFrame(frame.timestampMs);
      }
      return {
        timestampMs: frame.timestampMs,
        landmarks: frame.landmarks.map(cloneLandmark),
      };
    });
    const poisoned = withFrames(fixture, poisonedFrames);
    const receipt = computeReceipt(poisoned);
    const acceptedEvents = detectStepEvents(poisoned).filter((event) => event.accepted);

    expect(receipt.quality.grade).toBe('accepted');
    expect(acceptedEvents.length).toBeGreaterThanOrEqual(Math.max(10, baselineAccepted - 4));
    expect(acceptedEvents.filter((event) => event.side === 'left').length).toBeGreaterThanOrEqual(5);
    expect(acceptedEvents.filter((event) => event.side === 'right').length).toBeGreaterThanOrEqual(5);
  });
});

describe('local-maxima heel-low detector (review 4)', () => {
  it('accepts a clean periodic walk whose amplitude drifts downward across the capture', () => {
    const fixture = buildAmplitudeDriftFixture();
    const events = detectStepEvents(fixture);
    const acceptedEvents = events.filter((event) => event.accepted);
    const left = acceptedEvents.filter((event) => event.side === 'left');
    const right = acceptedEvents.filter((event) => event.side === 'right');

    expect(left.length).toBeGreaterThanOrEqual(5);
    expect(right.length).toBeGreaterThanOrEqual(5);

    const receipt = computeReceipt(fixture);
    expect(receipt.quality.grade).toBe('accepted');
    expect(receipt.quality.leftAcceptedCount).toBeGreaterThanOrEqual(5);
    expect(receipt.quality.rightAcceptedCount).toBeGreaterThanOrEqual(5);
  });

  it('places candidate timestamps at local low-heel extrema, not threshold-entry crossings', () => {
    const fixture = buildSinglePeakFixture();
    const left = detectStepEvents(fixture).filter((event) => event.side === 'left');
    expect(left.length).toBe(1);

    const smoothed = smoothSeries(leftBodyRelativeSeries(fixture), 2);
    const threshold = percentile(smoothed, 0.6);
    const eventIndex = fixture.frames.findIndex(
      (frame) => frame.timestampMs === left[0].timestampMs,
    );
    expect(eventIndex).toBeGreaterThan(0);
    expect(eventIndex).toBeLessThan(smoothed.length - 1);

    // Local-maxima rule: center > previous && center >= next.
    expect(smoothed[eventIndex]).toBeGreaterThan(smoothed[eventIndex - 1]);
    expect(smoothed[eventIndex]).toBeGreaterThanOrEqual(smoothed[eventIndex + 1]);

    // Entry-crossing would fire at the first rise across the percentile floor.
    let entryIndex = -1;
    for (let i = 1; i < smoothed.length; i += 1) {
      if (smoothed[i - 1] < threshold && smoothed[i] >= threshold) {
        entryIndex = i;
        break;
      }
    }
    expect(entryIndex).toBeGreaterThanOrEqual(0);
    expect(eventIndex).toBeGreaterThan(entryIndex);
    // Peak constructed at raw index 12; radius-2 smooth may shift by at most one sample.
    expect(Math.abs(eventIndex - 12)).toBeLessThanOrEqual(1);
  });

  it('emits no events on a constant signal', () => {
    const fixture = validateFixture(accepted);
    const constantLandmarks = fixture.frames[0].landmarks.map(cloneLandmark);
    const frames = fixture.frames.map((frame) => ({
      timestampMs: frame.timestampMs,
      landmarks: constantLandmarks.map(cloneLandmark),
    }));
    const constant = withFrames(fixture, frames);
    expect(detectStepEvents(constant)).toEqual([]);
  });

  it('exposes a deterministic percentile helper', () => {
    expect(percentile([1, 2, 3, 4, 5], 0.6)).toBeCloseTo(3.4, 8);
    expect(percentile([10], 0.6)).toBe(10);
  });
});
