import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import insufficient from '../src/fixtures/insufficient-evidence.json';
import { validateFixture } from '../src/fixtures/schema';
import { copy } from '../src/copy/copy';
import { partitionEventEvidence } from '../src/metrics/quality';
import {
  canSurfaceTiming,
  computeReceipt,
  formatReceiptDisplay,
} from '../src/metrics/receipt';
import { detectStepEvents } from '../src/metrics/stepEvents';

describe('quality evidence counts', () => {
  it('match actual events array partitions on the accepted fixture', () => {
    const fixture = validateFixture(accepted);
    const events = detectStepEvents(fixture);
    const partitioned = partitionEventEvidence(events);
    const receipt = computeReceipt(fixture);

    expect(receipt.quality.grade).toBe('accepted');
    expect(receipt.quality.sampledFrameCount).toBe(fixture.frames.length);
    expect(receipt.quality.acceptedCount).toBe(partitioned.acceptedCount);
    expect(receipt.quality.rejectedCount).toBe(partitioned.rejectedCount);
    expect(receipt.quality.leftCandidateCount).toBe(partitioned.leftCandidateCount);
    expect(receipt.quality.rightCandidateCount).toBe(partitioned.rightCandidateCount);
    expect(receipt.quality.leftAcceptedCount).toBe(partitioned.leftAcceptedCount);
    expect(receipt.quality.rightAcceptedCount).toBe(partitioned.rightAcceptedCount);
    expect(receipt.quality.rejectedByReason).toEqual(partitioned.rejectedByReason);

    expect(receipt.quality.leftCandidateCount).toBe(
      events.filter((event) => event.side === 'left').length,
    );
    expect(receipt.quality.rightCandidateCount).toBe(
      events.filter((event) => event.side === 'right').length,
    );
    expect(receipt.quality.leftAcceptedCount).toBe(
      events.filter((event) => event.side === 'left' && event.accepted).length,
    );
    expect(receipt.quality.rightAcceptedCount).toBe(
      events.filter((event) => event.side === 'right' && event.accepted).length,
    );
    expect(receipt.quality.rejectedByReason.left['low-visibility']).toBe(
      events.filter(
        (event) =>
          event.side === 'left' &&
          !event.accepted &&
          event.rejectReason === 'low-visibility',
      ).length,
    );
    expect(receipt.quality.rejectedByReason.left.discontinuity).toBe(
      events.filter(
        (event) =>
          event.side === 'left' &&
          !event.accepted &&
          event.rejectReason === 'discontinuity',
      ).length,
    );
    expect(receipt.quality.rejectedByReason.right['low-visibility']).toBe(
      events.filter(
        (event) =>
          event.side === 'right' &&
          !event.accepted &&
          event.rejectReason === 'low-visibility',
      ).length,
    );
    expect(receipt.quality.rejectedByReason.right.discontinuity).toBe(
      events.filter(
        (event) =>
          event.side === 'right' &&
          !event.accepted &&
          event.rejectReason === 'discontinuity',
      ).length,
    );
  });

  it('exposes evidence on the insufficient fixture while timing stays unavailable', () => {
    const fixture = validateFixture(insufficient);
    const receipt = computeReceipt(fixture);
    expect(receipt.quality.grade).toBe('insufficient');
    expect(canSurfaceTiming(receipt)).toBe(false);

    expect(receipt.quality.sampledFrameCount).toBe(fixture.frames.length);
    expect(typeof receipt.quality.leftCandidateCount).toBe('number');
    expect(typeof receipt.quality.rightCandidateCount).toBe('number');
    expect(typeof receipt.quality.leftAcceptedCount).toBe('number');
    expect(typeof receipt.quality.rightAcceptedCount).toBe('number');
    expect(receipt.quality.rejectedByReason.left).toEqual({
      'low-visibility': expect.any(Number),
      discontinuity: expect.any(Number),
    });

    const display = formatReceiptDisplay(receipt);
    expect(display.leftMedianMs).toBe(copy.timingNotReported);
    expect(display.rightMedianMs).toBe(copy.timingNotReported);
    expect(display.deltaMs).toBe(copy.timingNotReported);
    expect(display.leftKneeRangeDeg).toBe(copy.timingNotReported);
    expect(display.rightKneeRangeDeg).toBe(copy.timingNotReported);
  });
});
