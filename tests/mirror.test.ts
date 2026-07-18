import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import { validateFixture } from '../src/fixtures/schema';
import { mirrorFixture } from '../src/metrics/mirror';
import { computeReceipt } from '../src/metrics/receipt';

describe('semantic mirror transform', () => {
  it('swaps side labels while preserving timing magnitudes', () => {
    const fixture = validateFixture(accepted);
    const original = computeReceipt(fixture);
    const mirrored = computeReceipt(mirrorFixture(fixture));

    expect(mirrored.quality.grade).toBe('accepted');
    expect(mirrored.left.medianMs).toBeCloseTo(original.right.medianMs, 0);
    expect(mirrored.right.medianMs).toBeCloseTo(original.left.medianMs, 0);
    expect(Math.abs(mirrored.deltaMs)).toBeCloseTo(Math.abs(original.deltaMs), 0);
    expect(mirrored.left.spreadMs).toBeCloseTo(original.right.spreadMs, 0);
    expect(mirrored.right.spreadMs).toBeCloseTo(original.left.spreadMs, 0);
  });
});
