import { describe, expect, it } from 'vitest';
import {
  lintClaims,
  SEED_ALLOWED_CLAIMS,
  SEED_BLOCKED_CLAIMS,
} from '../scripts/claimsLint';
import { copy } from '../src/copy/copy';

describe('context-aware claims lint', () => {
  it('rejects seeded affirmative unsafe claims', () => {
    for (const claim of SEED_BLOCKED_CLAIMS) {
      const result = lintClaims(claim);
      expect(result.ok, claim).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    }
  });

  it('allows explicit negation and not-established boundary copy', () => {
    for (const claim of SEED_ALLOWED_CLAIMS) {
      const result = lintClaims(claim);
      expect(result.ok, `${claim} :: ${result.violations.join('; ')}`).toBe(true);
    }

    expect(lintClaims(copy.forkDisclaimer).ok).toBe(true);
    expect(lintClaims(copy.bodyDiffFooter).ok).toBe(true);
    expect(lintClaims(copy.notEstablished).ok).toBe(true);
    expect(lintClaims(`${copy.notEstablished} are not established.`).ok).toBe(true);
  });

  it('blocks mixed negation-plus-diagnosis clauses', () => {
    const result = lintClaims('This is not a prediction, but you have arthritis.');
    expect(result.ok).toBe(false);
    expect(result.violations.some((item) => item.includes('diagnosis'))).toBe(true);
  });
});
