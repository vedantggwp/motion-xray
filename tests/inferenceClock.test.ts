import { describe, expect, it } from 'vitest';
import {
  InferenceClock,
  advanceInferenceClock,
  createInferenceClockState,
  nextInferenceTimestamp,
} from '../src/live/inferenceClock';

describe('inference graph clock', () => {
  it('keeps media resets strictly increasing and preserves within-source deltas', () => {
    // Source A: media timestamps beginning at zero.
    const clock = new InferenceClock();
    const sourceA = [0, 50, 100, 150];
    const graphA = sourceA.map((media) => clock.next(media));
    expect(graphA).toEqual([0, 50, 100, 150]);
    expect(clock.peekLast()).toBe(150);

    // Source B: new file/camera also begins at media time 0 on the same graph.
    // Must preserve media deltas: [151, 201, 251], not [151, 152, 153].
    const sourceB = [0, 50, 100];
    const graphB = sourceB.map((media) => clock.next(media));
    expect(graphB[0]).toBe(151);
    expect(graphB).toEqual([151, 201, 251]);
    for (let i = 1; i < graphB.length; i += 1) {
      expect(graphB[i]).toBeGreaterThan(graphB[i - 1]);
      expect(graphB[i] - graphB[i - 1]).toBe(sourceB[i] - sourceB[i - 1]);
    }
  });

  it('preserves monotonic media progression within one source', () => {
    const clock = new InferenceClock();
    expect(clock.next(0)).toBe(0);
    expect(clock.next(33)).toBe(33);
    expect(clock.next(66)).toBe(66);
    expect(clock.peekLast()).toBe(66);
  });

  it('handles the observed MediaPipe mismatch shape (large last, media 0)', () => {
    expect(nextInferenceTimestamp(7_700_001, 0)).toBe(7_700_002);
    let state = {
      ...createInferenceClockState(),
      lastGraphTimestampMs: 7_700_001,
      lastMediaTimestampMs: 7_700_001,
      offsetMs: 0,
    };
    const first = advanceInferenceClock(state, 0);
    expect(first.graphTimestampMs).toBe(7_700_002);
    state = first.state;
    const second = advanceInferenceClock(state, 50);
    expect(second.graphTimestampMs).toBe(7_700_052);
    const third = advanceInferenceClock(second.state, 100);
    expect(third.graphTimestampMs).toBe(7_700_102);
  });
});
