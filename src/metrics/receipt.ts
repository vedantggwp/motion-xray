import { copy } from '../copy/copy';
import type { MotionFixture, MotionReceipt, SideTiming } from '../fixtures/schema';
import { computeKneeFlexion } from './kneeFlexion';
import { gradeCapture } from './quality';
import { detectStepEvents } from './stepEvents';
import { computeDelta, computeSideTiming } from './timing';

const EMPTY_SIDE: SideTiming = {
  intervalsMs: [],
  medianMs: 0,
  spreadMs: 0,
};

export const NOT_ESTABLISHED = copy.notEstablishedList;

export function computeReceipt(fixture: MotionFixture): MotionReceipt {
  const events = detectStepEvents(fixture);
  const quality = gradeCapture(fixture, events);
  const kneeFlexion = computeKneeFlexion(fixture);

  if (quality.grade === 'insufficient') {
    return {
      fixtureId: fixture.id,
      source: fixture.source,
      events,
      left: EMPTY_SIDE,
      right: EMPTY_SIDE,
      deltaMs: 0,
      deltaPct: 0,
      quality,
      kneeFlexion: {
        ...kneeFlexion,
        sufficient: false,
        left: null,
        right: null,
      },
      notEstablished: NOT_ESTABLISHED,
    };
  }

  const left = computeSideTiming(events, 'left');
  const right = computeSideTiming(events, 'right');
  const { deltaMs, deltaPct } = computeDelta(left.medianMs, right.medianMs);

  return {
    fixtureId: fixture.id,
    source: fixture.source,
    events,
    left,
    right,
    deltaMs,
    deltaPct,
    quality,
    kneeFlexion,
    notEstablished: NOT_ESTABLISHED,
  };
}

/** Public display formatting — never surfaces timing for insufficient captures. */
export type ReceiptDisplay = {
  grade: 'accepted' | 'insufficient';
  leftMedianMs: string;
  rightMedianMs: string;
  leftSpreadMs: string;
  rightSpreadMs: string;
  deltaMs: string;
  deltaPct: string;
  footVisibilityMean: string;
  acceptedCount: string;
  rejectedCount: string;
  frameGaps: string;
  leftKneeRangeDeg: string;
  rightKneeRangeDeg: string;
  kneeFlexionLabel: string;
  reasonCodes: string;
};

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}

function formatPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}

function formatDeg(value: number): string {
  return `${Math.round(value * 10) / 10}°`;
}

export function formatReceiptDisplay(receipt: MotionReceipt): ReceiptDisplay {
  const reasonCodes =
    receipt.quality.reasonCodes.length > 0
      ? receipt.quality.reasonCodes.join(', ')
      : 'none';

  if (receipt.quality.grade === 'insufficient') {
    return {
      grade: 'insufficient',
      leftMedianMs: copy.timingNotReported,
      rightMedianMs: copy.timingNotReported,
      leftSpreadMs: copy.timingNotReported,
      rightSpreadMs: copy.timingNotReported,
      deltaMs: copy.timingNotReported,
      deltaPct: copy.timingNotReported,
      footVisibilityMean: receipt.quality.footVisibilityMean.toFixed(2),
      acceptedCount: String(receipt.quality.acceptedCount),
      rejectedCount: String(receipt.quality.rejectedCount),
      frameGaps: String(receipt.quality.frameGaps),
      leftKneeRangeDeg: copy.timingNotReported,
      rightKneeRangeDeg: copy.timingNotReported,
      kneeFlexionLabel: copy.kneeFlexionLabel,
      reasonCodes,
    };
  }

  const kneeOk = receipt.kneeFlexion.sufficient;
  return {
    grade: 'accepted',
    leftMedianMs: formatMs(receipt.left.medianMs),
    rightMedianMs: formatMs(receipt.right.medianMs),
    leftSpreadMs: formatMs(receipt.left.spreadMs),
    rightSpreadMs: formatMs(receipt.right.spreadMs),
    deltaMs: formatMs(receipt.deltaMs),
    deltaPct: formatPct(receipt.deltaPct),
    footVisibilityMean: receipt.quality.footVisibilityMean.toFixed(2),
    acceptedCount: String(receipt.quality.acceptedCount),
    rejectedCount: String(receipt.quality.rejectedCount),
    frameGaps: String(receipt.quality.frameGaps),
    leftKneeRangeDeg:
      kneeOk && receipt.kneeFlexion.left
        ? formatDeg(receipt.kneeFlexion.left.rangeDeg)
        : copy.timingNotReported,
    rightKneeRangeDeg:
      kneeOk && receipt.kneeFlexion.right
        ? formatDeg(receipt.kneeFlexion.right.rangeDeg)
        : copy.timingNotReported,
    kneeFlexionLabel: copy.kneeFlexionLabel,
    reasonCodes,
  };
}

export function canSurfaceTiming(receipt: MotionReceipt): boolean {
  return receipt.quality.grade === 'accepted';
}
