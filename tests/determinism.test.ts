import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import { validateFixture } from '../src/fixtures/schema';
import { computeReceipt } from '../src/metrics/receipt';

describe('deterministic receipt equality', () => {
  it('produces deep-equal receipts for identical fixture input', () => {
    const fixture = validateFixture(accepted);
    const a = computeReceipt(fixture);
    const b = computeReceipt(fixture);
    expect(a).toEqual(b);
  });
});
