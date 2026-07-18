import { describe, expect, it } from 'vitest';
import { createInitialState, reduce } from '../src/app/appState';

describe('app reducer transitions', () => {
  it('follows the golden-path transition table', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'PRESS_START' });
    expect(state.phase).toBe('resolving');
    expect(state.fixtureId).toBe('accepted-walk');

    state = reduce(state, { type: 'RESOLVE_ACCEPTED' });
    expect(state.phase).toBe('receipt');

    state = reduce(state, { type: 'SET_FORK_OPEN', open: true });
    state = reduce(state, { type: 'SET_FORK_VALUE', value: 0.4 });
    expect(state.fork).toEqual({ open: true, value: 0.4 });

    state = reduce(state, { type: 'OPEN_HANDOFF' });
    expect(state.handoffOpen).toBe(true);

    state = reduce(state, { type: 'ESCAPE' });
    expect(state.handoffOpen).toBe(false);

    state = reduce(state, { type: 'SWITCH_FIXTURE', fixtureId: 'insufficient-evidence' });
    expect(state.phase).toBe('resolving');
    state = reduce(state, { type: 'RESOLVE_ABSTAINED' });
    expect(state.phase).toBe('abstained');
  });

  it('no-ops illegal events and keeps fork actions scoped', () => {
    const hero = createInitialState();
    expect(reduce(hero, { type: 'RESOLVE_ACCEPTED' })).toEqual(hero);
    expect(reduce(hero, { type: 'SET_FORK_VALUE', value: 1 })).toEqual(hero);
    expect(reduce(hero, { type: 'OPEN_HANDOFF' })).toEqual(hero);

    let receipt = reduce(reduce(hero, { type: 'PRESS_START' }), { type: 'RESOLVE_ACCEPTED' });
    const before = receipt;
    receipt = reduce(receipt, { type: 'SET_FORK_VALUE', value: 0.8 });
    expect(receipt).toEqual(before);

    receipt = reduce(receipt, { type: 'SET_FORK_OPEN', open: true });
    receipt = reduce(receipt, { type: 'SET_FORK_VALUE', value: 0.8 });
    expect(receipt.fork.value).toBe(0.8);
    expect(receipt.phase).toBe('receipt');
  });

  it('opens sources from hero and picks into resolving', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'OPEN_SOURCES' });
    expect(state.phase).toBe('source-select');
    state = reduce(state, { type: 'PICK', source: 'insufficient-evidence' });
    expect(state.phase).toBe('resolving');
    expect(state.fixtureId).toBe('insufficient-evidence');
  });

  it('returns to the prior phase when the source picker closes without picking', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'PRESS_START' });
    state = reduce(state, { type: 'RESOLVE_ACCEPTED' });
    expect(state.phase).toBe('receipt');

    state = reduce(state, { type: 'OPEN_SOURCES' });
    expect(state.phase).toBe('source-select');
    expect(state.sourcePickerReturnPhase).toBe('receipt');

    state = reduce(state, { type: 'ESCAPE' });
    expect(state.phase).toBe('receipt');
    expect(state.sourcePickerOpen).toBe(false);
    expect(state.sourcePickerReturnPhase).toBeNull();
  });

  it('moves through live capture phases and cancels the topmost capture surface on Escape', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'OPEN_SOURCES' });
    state = reduce(state, { type: 'START_LIVE_CAPTURE' });
    expect(state.phase).toBe('model-loading');
    expect(state.fixtureId).toBe('live-camera');

    state = reduce(state, {
      type: 'SET_CAPTURE_PHASE',
      phase: 'countdown',
      detail: 'Countdown 2',
      progress: 0.3,
    });
    expect(state.phase).toBe('countdown');

    state = reduce(state, { type: 'ESCAPE' });
    expect(state.phase).toBe('cancelled');
  });
});
