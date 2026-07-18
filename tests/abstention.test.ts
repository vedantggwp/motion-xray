import { describe, expect, it } from 'vitest';
import insufficient from '../src/fixtures/insufficient-evidence.json';
import { validateFixture } from '../src/fixtures/schema';
import {
  canSurfaceTiming,
  computeReceipt,
  formatReceiptDisplay,
} from '../src/metrics/receipt';
import { copy } from '../src/copy/copy';

describe('insufficient evidence abstention', () => {
  it('grades insufficient and cannot surface timing display fields', () => {
    const receipt = computeReceipt(validateFixture(insufficient));
    expect(receipt.quality.grade).toBe('insufficient');
    expect(canSurfaceTiming(receipt)).toBe(false);

    // Capture evidence remains inspectable on abstention.
    expect(receipt.quality.sampledFrameCount).toBeGreaterThan(0);
    expect(receipt.quality.leftCandidateCount + receipt.quality.rightCandidateCount).toBe(
      receipt.events.length,
    );

    const display = formatReceiptDisplay(receipt);
    expect(display.leftMedianMs).toBe(copy.timingNotReported);
    expect(display.rightMedianMs).toBe(copy.timingNotReported);
    expect(display.deltaMs).toBe(copy.timingNotReported);
    expect(display.deltaPct).toBe(copy.timingNotReported);
    expect(display.leftSpreadMs).toBe(copy.timingNotReported);
    expect(display.rightSpreadMs).toBe(copy.timingNotReported);
    expect(display.leftKneeRangeDeg).toBe(copy.timingNotReported);
    expect(display.rightKneeRangeDeg).toBe(copy.timingNotReported);
  });
});
