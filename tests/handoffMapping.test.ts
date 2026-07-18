import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import { validateFixture } from '../src/fixtures/schema';
import { computeReceipt, formatReceiptDisplay } from '../src/metrics/receipt';
import { buildHandoffViewModel } from '../src/ui/HandoffDrawer';

describe('handoff number mapping', () => {
  it('maps every handoff numeric token to a receipt display field', () => {
    const receipt = computeReceipt(validateFixture(accepted));
    const display = formatReceiptDisplay(receipt);
    const handoff = buildHandoffViewModel(display);

    expect(handoff.leftMedianMs).toBe(display.leftMedianMs);
    expect(handoff.rightMedianMs).toBe(display.rightMedianMs);
    expect(handoff.deltaMs).toBe(display.deltaMs);
    expect(handoff.deltaPct).toBe(display.deltaPct);
    expect(handoff.leftSpreadMs).toBe(display.leftSpreadMs);
    expect(handoff.rightSpreadMs).toBe(display.rightSpreadMs);
    expect(handoff.footVisibilityMean).toBe(display.footVisibilityMean);
    expect(handoff.acceptedCount).toBe(display.acceptedCount);
    expect(handoff.rejectedCount).toBe(display.rejectedCount);
    expect(handoff.grade).toBe(display.grade);
    expect(handoff.leftKneeRangeDeg).toBe(display.leftKneeRangeDeg);
    expect(handoff.rightKneeRangeDeg).toBe(display.rightKneeRangeDeg);

    // No raw arithmetic leaked: formatted strings must match receipt fields only.
    expect(handoff.leftMedianMs).toMatch(/ms$/);
    expect(handoff.deltaPct).toMatch(/%$/);
    expect(handoff.leftKneeRangeDeg).toMatch(/°$/);
  });
});
