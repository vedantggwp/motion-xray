import type {
  EventRejectReason,
  MotionFixture,
  QualityEvidence,
  QualityReasonCode,
  RejectedCountsByReason,
  StepEvent,
} from '../fixtures/schema';
import { FOOT_LANDMARK_INDICES, LANDMARK_COUNT } from '../fixtures/schema';
import { MIN_CAPTURE_DURATION_MS } from '../live/captureConstants';

const FOOT_VISIBILITY_GATE = 0.6;
const MIN_ACCEPTED_PER_SIDE = 5;
const GAP_THRESHOLD_MS = 100;
const POSE_PRESENCE_GATE = 0.7;
/**
 * Material frame-gap gate: ignore a single scheduling hiccup.
 * Requires ≥2 gaps above GAP_THRESHOLD_MS and gap ratio ≥ this fraction of intervals.
 */
const MATERIAL_GAP_RATIO_GATE = 0.1;
const MIN_GAPS_FOR_MATERIAL = 2;
/** Max normalized landmark travel per ms for hips/ankles/heels before counting as teleport. */
const TELEPORT_SPEED = 0.0045;
const TELEPORT_FRAME_RATIO_GATE = 0.08;
const INTERVAL_CV_GATE = 0.55;
const ALTERNATION_GATE = 0.55;
const TRACK_INDICES = [23, 24, 27, 28, 29, 30] as const;

/** Capture-protocol quality report — alias of the fixture receipt quality evidence. */
export type QualityReport = QualityEvidence;

function emptyRejectedByReason(): RejectedCountsByReason {
  return {
    left: { 'low-visibility': 0, discontinuity: 0 },
    right: { 'low-visibility': 0, discontinuity: 0 },
  };
}

/** Partition events into the inspectable evidence counts shown on Measurement receipt. */
export function partitionEventEvidence(events: StepEvent[]): {
  acceptedCount: number;
  rejectedCount: number;
  leftCandidateCount: number;
  rightCandidateCount: number;
  leftAcceptedCount: number;
  rightAcceptedCount: number;
  rejectedByReason: RejectedCountsByReason;
} {
  const rejectedByReason = emptyRejectedByReason();
  let acceptedCount = 0;
  let leftCandidateCount = 0;
  let rightCandidateCount = 0;
  let leftAcceptedCount = 0;
  let rightAcceptedCount = 0;

  for (const event of events) {
    if (event.side === 'left') {
      leftCandidateCount += 1;
    } else {
      rightCandidateCount += 1;
    }

    if (event.accepted) {
      acceptedCount += 1;
      if (event.side === 'left') {
        leftAcceptedCount += 1;
      } else {
        rightAcceptedCount += 1;
      }
      continue;
    }

    const reason: EventRejectReason = event.rejectReason ?? 'low-visibility';
    rejectedByReason[event.side][reason] += 1;
  }

  return {
    acceptedCount,
    rejectedCount: events.length - acceptedCount,
    leftCandidateCount,
    rightCandidateCount,
    leftAcceptedCount,
    rightAcceptedCount,
    rejectedByReason,
  };
}

export function meanFootVisibility(fixture: MotionFixture): number {
  let sum = 0;
  let count = 0;
  for (const frame of fixture.frames) {
    for (const index of FOOT_LANDMARK_INDICES) {
      sum += frame.landmarks[index].visibility;
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

export function countFrameGaps(fixture: MotionFixture): number {
  let gaps = 0;
  for (let i = 1; i < fixture.frames.length; i += 1) {
    const gap = fixture.frames[i].timestampMs - fixture.frames[i - 1].timestampMs;
    if (gap > GAP_THRESHOLD_MS) {
      gaps += 1;
    }
  }
  return gaps;
}

export function captureDurationMs(fixture: MotionFixture): number {
  if (fixture.frames.length === 0) {
    return 0;
  }
  return (
    fixture.frames[fixture.frames.length - 1].timestampMs - fixture.frames[0].timestampMs
  );
}

export function posePresenceRate(fixture: MotionFixture): number {
  if (fixture.frames.length === 0) {
    return 0;
  }
  let present = 0;
  for (const frame of fixture.frames) {
    if (frame.landmarks.length === LANDMARK_COUNT) {
      const meanVis =
        frame.landmarks.reduce((sum, landmark) => sum + landmark.visibility, 0) /
        frame.landmarks.length;
      if (meanVis >= 0.35) {
        present += 1;
      }
    }
  }
  return present / fixture.frames.length;
}

/**
 * Count frames where tracked landmarks teleport faster than a capture-plausible speed.
 * This is the gate that rejects temporally shuffled landmark sequences with ordered timestamps.
 */
export function countTeleportFrames(fixture: MotionFixture): number {
  let teleports = 0;
  for (let i = 1; i < fixture.frames.length; i += 1) {
    const prev = fixture.frames[i - 1];
    const next = fixture.frames[i];
    const dt = Math.max(1, next.timestampMs - prev.timestampMs);
    let maxSpeed = 0;
    for (const index of TRACK_INDICES) {
      const a = prev.landmarks[index];
      const b = next.landmarks[index];
      if (a.visibility < 0.3 || b.visibility < 0.3) {
        continue;
      }
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      maxSpeed = Math.max(maxSpeed, dist / dt);
    }
    if (maxSpeed > TELEPORT_SPEED) {
      teleports += 1;
    }
  }
  return teleports;
}

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean <= 1e-9) {
    return Number.POSITIVE_INFINITY;
  }
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function sameSideIntervalCv(events: StepEvent[], side: 'left' | 'right'): number {
  const times = events
    .filter((event) => event.side === side && event.accepted)
    .map((event) => event.timestampMs)
    .sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    intervals.push(times[i] - times[i - 1]);
  }
  return coefficientOfVariation(intervals);
}

/** Fraction of consecutive accepted-event pairs that alternate side. */
export function alternationScore(events: StepEvent[]): number {
  const accepted = events
    .filter((event) => event.accepted)
    .sort((a, b) => a.timestampMs - b.timestampMs);
  if (accepted.length < 2) {
    return 0;
  }
  let alternating = 0;
  for (let i = 1; i < accepted.length; i += 1) {
    if (accepted[i].side !== accepted[i - 1].side) {
      alternating += 1;
    }
  }
  return alternating / (accepted.length - 1);
}

export function gradeCapture(
  fixture: MotionFixture,
  events: StepEvent[],
): QualityReport {
  const footVisibilityMean = meanFootVisibility(fixture);
  const frameGaps = countFrameGaps(fixture);
  const evidence = partitionEventEvidence(events);
  const { leftAcceptedCount, rightAcceptedCount } = evidence;
  const durationMs = captureDurationMs(fixture);
  const presence = posePresenceRate(fixture);
  const teleportFrameCount = countTeleportFrames(fixture);
  const teleportRatio =
    fixture.frames.length > 1 ? teleportFrameCount / (fixture.frames.length - 1) : 0;
  const intervalCvLeft = sameSideIntervalCv(events, 'left');
  const intervalCvRight = sameSideIntervalCv(events, 'right');
  const alternation = alternationScore(events);

  const reasonCodes: QualityReasonCode[] = [];

  if (durationMs < MIN_CAPTURE_DURATION_MS || fixture.frames.length < 30) {
    reasonCodes.push('capture-too-short');
  }
  if (presence < POSE_PRESENCE_GATE) {
    reasonCodes.push('missing-pose');
  }
  if (footVisibilityMean < FOOT_VISIBILITY_GATE) {
    reasonCodes.push('poor-foot-visibility');
  }
  if (teleportRatio > TELEPORT_FRAME_RATIO_GATE) {
    reasonCodes.push('temporal-discontinuity');
  }
  const intervalCount = Math.max(0, fixture.frames.length - 1);
  const gapRatio = intervalCount > 0 ? frameGaps / intervalCount : 0;
  if (frameGaps >= MIN_GAPS_FOR_MATERIAL && gapRatio >= MATERIAL_GAP_RATIO_GATE) {
    reasonCodes.push('material-frame-gaps');
  }
  if (
    leftAcceptedCount < MIN_ACCEPTED_PER_SIDE ||
    rightAcceptedCount < MIN_ACCEPTED_PER_SIDE
  ) {
    reasonCodes.push('insufficient-events-per-side');
  }
  if (
    leftAcceptedCount >= MIN_ACCEPTED_PER_SIDE &&
    rightAcceptedCount >= MIN_ACCEPTED_PER_SIDE &&
    (intervalCvLeft > INTERVAL_CV_GATE || intervalCvRight > INTERVAL_CV_GATE)
  ) {
    reasonCodes.push('irregular-intervals');
  }
  if (
    leftAcceptedCount >= MIN_ACCEPTED_PER_SIDE &&
    rightAcceptedCount >= MIN_ACCEPTED_PER_SIDE &&
    alternation < ALTERNATION_GATE
  ) {
    reasonCodes.push('incoherent-event-sequence');
  }

  const grade = reasonCodes.length === 0 ? 'accepted' : 'insufficient';

  return {
    footVisibilityMean,
    frameGaps,
    acceptedCount: evidence.acceptedCount,
    rejectedCount: evidence.rejectedCount,
    grade,
    durationMs,
    posePresenceRate: presence,
    teleportFrameCount,
    intervalCvLeft,
    intervalCvRight,
    alternationScore: alternation,
    reasonCodes,
    sampledFrameCount: fixture.frames.length,
    leftCandidateCount: evidence.leftCandidateCount,
    rightCandidateCount: evidence.rightCandidateCount,
    leftAcceptedCount,
    rightAcceptedCount,
    rejectedByReason: evidence.rejectedByReason,
  };
}
