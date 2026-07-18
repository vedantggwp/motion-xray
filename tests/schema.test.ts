import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import insufficient from '../src/fixtures/insufficient-evidence.json';
import { FixtureSchemaError, validateFixture } from '../src/fixtures/schema';

describe('fixture schema validation', () => {
  it('accepts committed fixtures', () => {
    expect(validateFixture(accepted).id).toBe('accepted-walk');
    expect(validateFixture(insufficient).id).toBe('insufficient-evidence');
  });

  it('rejects malformed fixtures with a visible schema error', () => {
    expect(() => validateFixture({ id: 'x' })).toThrow(FixtureSchemaError);
    expect(() =>
      validateFixture({
        id: 'bad',
        label: 'bad',
        source: 'synthetic-fixture',
        fps: 30,
        frames: [{ timestampMs: 0, landmarks: [] }],
      }),
    ).toThrow(/exactly 33/);
  });
});
