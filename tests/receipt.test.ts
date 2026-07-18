import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import { validateFixture } from '../src/fixtures/schema';
import { computeReceipt } from '../src/metrics/receipt';

describe('receipt integrity', () => {
  it('grades the accepted fixture and exposes timing magnitudes', () => {
    const receipt = computeReceipt(validateFixture(accepted));
    expect(receipt.quality.grade).toBe('accepted');
    expect(receipt.left.medianMs).toBeGreaterThan(0);
    expect(receipt.right.medianMs).toBeGreaterThan(0);
    expect(receipt.quality.acceptedCount).toBeGreaterThanOrEqual(10);
  });
});
