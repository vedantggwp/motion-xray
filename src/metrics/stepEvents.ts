import type { MotionFixture, StepEvent } from '../fixtures/schema';
import {
  LEFT_ANKLE,
  LEFT_HEEL,
  LEFT_HIP,
  RIGHT_ANKLE,
  RIGHT_HEEL,
  RIGHT_HIP,
} from '../fixtures/schema';

const REFRACTORY_MS = 500;
const WINDOW_RADIUS = 2;
const CONFIDENCE_GATE = 0.6;
const GAP_GATE_MS = 100;
const SMOOTH_RADIUS = 2;
/**
 * Landmark visibility at or below this is treated as absent for the heel signal.
 * Zero-visibility placeholder coordinates must not enter smoothing/threshold evidence.
 */
const SIGNAL_VISIBILITY_GATE = 0;
/** Max consecutive missing samples to linearly interpolate for signal continuity only. */
const MAX_INTERPOLATE_RUN = 3;
/** Minimum dynamic range on the body-relative signal before events may be emitted. */
const MIN_SIGNAL_RANGE = 1e-4;
/** Percentile of originally-valid smoothed samples used as the low-heel candidate floor. */
const LOW_HEEL_PERCENTILE = 0.6;

function meanVisibility(
  fixture: MotionFixture,
  frameIndex: number,
  indices: readonly number[],
): number {
  const start = Math.max(0, frameIndex - WINDOW_RADIUS);
  const end = Math.min(fixture.frames.length - 1, frameIndex + WINDOW_RADIUS);
  let sum = 0;
  let count = 0;
  for (let i = start; i <= end; i += 1) {
    for (const index of indices) {
      sum += fixture.frames[i].landmarks[index].visibility;
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

function windowHasLargeGap(fixture: MotionFixture, frameIndex: number): boolean {
  const start = Math.max(0, frameIndex - WINDOW_RADIUS);
  const end = Math.min(fixture.frames.length - 1, frameIndex + WINDOW_RADIUS);
  for (let i = start + 1; i <= end; i += 1) {
    const gap = fixture.frames[i].timestampMs - fixture.frames[i - 1].timestampMs;
    if (gap > GAP_GATE_MS) {
      return true;
    }
  }
  return false;
}

/** Visibility-aware pelvis/hip reference Y (mid-hip when both hips are present). */
function pelvisReferenceY(frame: MotionFixture['frames'][number]): number | null {
  const left = frame.landmarks[LEFT_HIP];
  const right = frame.landmarks[RIGHT_HIP];
  const leftOk = left.visibility > SIGNAL_VISIBILITY_GATE;
  const rightOk = right.visibility > SIGNAL_VISIBILITY_GATE;
  if (leftOk && rightOk) {
    return (left.y + right.y) / 2;
  }
  if (leftOk) {
    return left.y;
  }
  if (rightOk) {
    return right.y;
  }
  return null;
}

/**
 * Body-relative heel height in image space (Y down).
 * Larger values mean the heel is lower relative to the pelvis.
 */
function bodyRelativeHeelSignal(
  frame: MotionFixture['frames'][number],
  heelIndex: number,
): number | null {
  const heel = frame.landmarks[heelIndex];
  if (heel.visibility <= SIGNAL_VISIBILITY_GATE) {
    return null;
  }
  const pelvisY = pelvisReferenceY(frame);
  if (pelvisY === null) {
    return null;
  }
  return heel.y - pelvisY;
}

/** Linearly fill only short interior null runs; long gaps stay null. */
function interpolateShortGaps(
  values: Array<number | null>,
  maxRun: number,
): Array<number | null> {
  const out = values.slice();
  let i = 0;
  while (i < out.length) {
    if (out[i] !== null) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < out.length && out[i] === null) {
      i += 1;
    }
    const end = i;
    const runLen = end - start;
    const left = start > 0 ? out[start - 1] : null;
    const right = end < out.length ? out[end] : null;
    if (runLen <= maxRun && left !== null && right !== null) {
      for (let j = start; j < end; j += 1) {
        const t = (j - start + 1) / (runLen + 1);
        out[j] = left + (right - left) * t;
      }
    }
  }
  return out;
}

/** Centered moving average that ignores nulls; null centers stay null. */
function smoothSeriesNullable(
  values: Array<number | null>,
  radius: number,
): Array<number | null> {
  return values.map((center, index) => {
    if (center === null) {
      return null;
    }
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length - 1, index + radius);
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const value = values[i];
      if (value !== null) {
        sum += value;
        count += 1;
      }
    }
    return count === 0 ? null : sum / count;
  });
}

/**
 * Deterministic percentile of a non-empty numeric sample.
 * `p` is in [0, 1]; uses linear interpolation between adjacent ranks.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    throw new Error('percentile requires at least one value');
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) {
    return sorted[0];
  }
  const clamped = Math.min(1, Math.max(0, p));
  const rank = clamped * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) {
    return sorted[lo];
  }
  const t = rank - lo;
  return sorted[lo] * (1 - t) + sorted[hi] * t;
}

/**
 * Strict-or-right-tied local maximum on a numeric triple.
 * Image Y increases downward, so a local max is the low-heel extremum.
 */
function isLocalMaximum(prev: number, center: number, next: number): boolean {
  return center > prev && center >= next;
}

function detectSideEvents(
  fixture: MotionFixture,
  side: 'left' | 'right',
  heelIndex: number,
  ankleIndex: number,
): StepEvent[] {
  const events: StepEvent[] = [];
  const originallyValid: boolean[] = [];
  const raw = fixture.frames.map((frame) => {
    const value = bodyRelativeHeelSignal(frame, heelIndex);
    originallyValid.push(value !== null);
    return value;
  });

  const filled = interpolateShortGaps(raw, MAX_INTERPOLATE_RUN);
  const heights = smoothSeriesNullable(filled, SMOOTH_RADIUS);

  const thresholdSamples: number[] = [];
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < heights.length; i += 1) {
    const value = heights[i];
    // Threshold evidence from originally-valid samples only — never from placeholders.
    if (value === null || !originallyValid[i]) {
      continue;
    }
    thresholdSamples.push(value);
    if (value < minY) minY = value;
    if (value > maxY) maxY = value;
  }
  const range = maxY - minY;
  if (
    thresholdSamples.length < 2 ||
    !Number.isFinite(range) ||
    range < MIN_SIGNAL_RANGE
  ) {
    return [];
  }

  const lowHeelThreshold = percentile(thresholdSamples, LOW_HEEL_PERCENTILE);
  let lastAcceptedAt = -Infinity;

  for (let i = 1; i < heights.length - 1; i += 1) {
    const prev = heights[i - 1];
    const curr = heights[i];
    const next = heights[i + 1];
    if (prev === null || curr === null || next === null) {
      continue;
    }
    if (curr < lowHeelThreshold) {
      continue;
    }
    if (!isLocalMaximum(prev, curr, next)) {
      continue;
    }

    const timestampMs = fixture.frames[i].timestampMs;
    if (timestampMs - lastAcceptedAt < REFRACTORY_MS) {
      continue;
    }

    // Confidence uses original visibility — interpolated continuity is not evidence.
    const confidence = meanVisibility(fixture, i, [heelIndex, ankleIndex]);
    const discontinuous = windowHasLargeGap(fixture, i);
    const accepted = confidence >= CONFIDENCE_GATE && !discontinuous;

    const event: StepEvent = {
      side,
      timestampMs,
      confidence,
      accepted,
    };
    if (!accepted) {
      event.rejectReason = discontinuous ? 'discontinuity' : 'low-visibility';
    } else {
      lastAcceptedAt = timestampMs;
    }
    events.push(event);
  }

  return events;
}

/** Detect accepted heel-low event estimates — not measured heel strikes. */
export function detectStepEvents(fixture: MotionFixture): StepEvent[] {
  const left = detectSideEvents(fixture, 'left', LEFT_HEEL, LEFT_ANKLE);
  const right = detectSideEvents(fixture, 'right', RIGHT_HEEL, RIGHT_ANKLE);
  return [...left, ...right].sort((a, b) => a.timestampMs - b.timestampMs);
}
