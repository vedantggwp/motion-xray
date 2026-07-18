import type { FixtureId } from '../fixtures/schema';

export type Phase =
  | 'hero'
  | 'source-select'
  | 'model-loading'
  | 'framing'
  | 'countdown'
  | 'capturing'
  | 'processing'
  | 'resolving'
  | 'receipt'
  | 'abstained'
  | 'cancelled';

export type ReturnPhase = 'hero' | 'receipt' | 'abstained';

export type AppState = {
  phase: Phase;
  fixtureId: FixtureId;
  playheadMs: number;
  fork: { open: boolean; value: number };
  handoffOpen: boolean;
  sourcePickerOpen: boolean;
  /** Phase to restore when the source picker closes without picking. */
  sourcePickerReturnPhase: ReturnPhase | null;
  reducedMotion: boolean;
  evidenceFocus:
    | 'recorded'
    | 'estimated'
    | 'calculated'
    | 'illustrative'
    | 'research'
    | 'unavailable'
    | null;
  resolveStartedAt: number | null;
  fixtureError: string | null;
  captureProgress: number;
  captureDetail: string | null;
  breakthroughOpen: boolean;
};

export type AppEvent =
  | { type: 'PRESS_START' }
  | { type: 'OPEN_SOURCES' }
  | { type: 'PICK'; source: FixtureId }
  | { type: 'START_LIVE_CAPTURE' }
  | { type: 'START_FILE_CAPTURE' }
  | { type: 'SET_CAPTURE_PHASE'; phase: Extract<Phase, 'model-loading' | 'framing' | 'countdown' | 'capturing' | 'processing' | 'cancelled'>; detail?: string; progress?: number }
  | { type: 'RESOLVE_ACCEPTED' }
  | { type: 'RESOLVE_ABSTAINED' }
  | { type: 'SET_PLAYHEAD'; ms: number }
  | { type: 'SET_FORK_OPEN'; open: boolean }
  | { type: 'SET_FORK_VALUE'; value: number }
  | { type: 'OPEN_HANDOFF' }
  | { type: 'CLOSE_HANDOFF' }
  | { type: 'SWITCH_FIXTURE'; fixtureId: FixtureId }
  | { type: 'ESCAPE' }
  | { type: 'SET_REDUCED_MOTION'; value: boolean }
  | { type: 'SET_EVIDENCE_FOCUS'; focus: AppState['evidenceFocus'] }
  | { type: 'FIXTURE_ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'TOGGLE_BREAKTHROUGH'; open?: boolean }
  | { type: 'BEGIN_RESOLVE'; fixtureId: FixtureId };

function asReturnPhase(phase: Phase): ReturnPhase {
  if (phase === 'receipt' || phase === 'abstained') {
    return phase;
  }
  return 'hero';
}

const CAPTURE_PHASES: Phase[] = [
  'model-loading',
  'framing',
  'countdown',
  'capturing',
  'processing',
];

export function isCapturePhase(phase: Phase): boolean {
  return CAPTURE_PHASES.includes(phase);
}

export function createInitialState(reducedMotion = false): AppState {
  return {
    phase: 'hero',
    fixtureId: 'accepted-walk',
    playheadMs: 0,
    fork: { open: false, value: 0 },
    handoffOpen: false,
    sourcePickerOpen: false,
    sourcePickerReturnPhase: null,
    reducedMotion,
    evidenceFocus: null,
    resolveStartedAt: null,
    fixtureError: null,
    captureProgress: 0,
    captureDetail: null,
    breakthroughOpen: false,
  };
}

function beginResolving(state: AppState, fixtureId: FixtureId): AppState {
  return {
    ...state,
    phase: 'resolving',
    fixtureId,
    playheadMs: 0,
    fork: { open: false, value: 0 },
    handoffOpen: false,
    sourcePickerOpen: false,
    sourcePickerReturnPhase: null,
    resolveStartedAt: Date.now(),
    fixtureError: null,
    captureProgress: 0,
    captureDetail: null,
  };
}

export function reduce(state: AppState, event: AppEvent): AppState {
  switch (event.type) {
    case 'PRESS_START': {
      if (state.phase !== 'hero' && state.phase !== 'cancelled') {
        return state;
      }
      return beginResolving(state, 'accepted-walk');
    }
    case 'OPEN_SOURCES': {
      if (
        state.phase !== 'hero' &&
        state.phase !== 'receipt' &&
        state.phase !== 'abstained' &&
        state.phase !== 'cancelled'
      ) {
        return state;
      }
      return {
        ...state,
        phase: 'source-select',
        sourcePickerOpen: true,
        sourcePickerReturnPhase: asReturnPhase(state.phase),
      };
    }
    case 'PICK': {
      if (state.phase !== 'source-select') {
        return state;
      }
      if (event.source === 'live-camera' || event.source === 'local-video') {
        return state;
      }
      return beginResolving(state, event.source);
    }
    case 'START_LIVE_CAPTURE': {
      if (state.phase !== 'source-select' && !isCapturePhase(state.phase)) {
        return state;
      }
      return {
        ...state,
        phase: 'model-loading',
        fixtureId: 'live-camera',
        sourcePickerOpen: false,
        sourcePickerReturnPhase: null,
        handoffOpen: false,
        fork: { open: false, value: 0 },
        captureProgress: 0,
        captureDetail: 'Loading local Pose Landmarker…',
        fixtureError: null,
      };
    }
    case 'START_FILE_CAPTURE': {
      if (state.phase !== 'source-select' && !isCapturePhase(state.phase)) {
        return state;
      }
      return {
        ...state,
        phase: 'model-loading',
        fixtureId: 'local-video',
        sourcePickerOpen: false,
        sourcePickerReturnPhase: null,
        handoffOpen: false,
        fork: { open: false, value: 0 },
        captureProgress: 0,
        captureDetail: 'Loading local Pose Landmarker…',
        fixtureError: null,
      };
    }
    case 'SET_CAPTURE_PHASE': {
      if (!isCapturePhase(state.phase) && state.phase !== 'cancelled') {
        // Allow transition into capture phases from model-loading chain.
        if (
          event.phase !== 'model-loading' &&
          event.phase !== 'framing' &&
          event.phase !== 'countdown' &&
          event.phase !== 'capturing' &&
          event.phase !== 'processing' &&
          event.phase !== 'cancelled'
        ) {
          return state;
        }
      }
      return {
        ...state,
        phase: event.phase,
        captureDetail: event.detail ?? state.captureDetail,
        captureProgress:
          typeof event.progress === 'number' ? event.progress : state.captureProgress,
      };
    }
    case 'BEGIN_RESOLVE': {
      return beginResolving(state, event.fixtureId);
    }
    case 'RESOLVE_ACCEPTED': {
      if (state.phase !== 'resolving') {
        return state;
      }
      return { ...state, phase: 'receipt', resolveStartedAt: null };
    }
    case 'RESOLVE_ABSTAINED': {
      if (state.phase !== 'resolving') {
        return state;
      }
      return { ...state, phase: 'abstained', resolveStartedAt: null, fork: { open: false, value: 0 } };
    }
    case 'SET_PLAYHEAD': {
      if (state.phase !== 'receipt' && state.phase !== 'hero') {
        return state;
      }
      return { ...state, playheadMs: Math.max(0, event.ms) };
    }
    case 'SET_FORK_OPEN': {
      if (state.phase !== 'receipt') {
        return state;
      }
      return { ...state, fork: { ...state.fork, open: event.open } };
    }
    case 'SET_FORK_VALUE': {
      if (state.phase !== 'receipt' || !state.fork.open) {
        return state;
      }
      const value = Math.min(1, Math.max(0, event.value));
      return { ...state, fork: { ...state.fork, value } };
    }
    case 'OPEN_HANDOFF': {
      if (state.phase !== 'receipt') {
        return state;
      }
      return { ...state, handoffOpen: true };
    }
    case 'CLOSE_HANDOFF': {
      return { ...state, handoffOpen: false };
    }
    case 'SWITCH_FIXTURE': {
      if (
        state.phase !== 'receipt' &&
        state.phase !== 'abstained' &&
        state.phase !== 'hero' &&
        state.phase !== 'cancelled'
      ) {
        return state;
      }
      if (event.fixtureId === 'live-camera' || event.fixtureId === 'local-video') {
        return state;
      }
      return beginResolving(state, event.fixtureId);
    }
    case 'ESCAPE': {
      if (state.handoffOpen) {
        return { ...state, handoffOpen: false };
      }
      if (state.breakthroughOpen) {
        return { ...state, breakthroughOpen: false };
      }
      if (state.sourcePickerOpen || state.phase === 'source-select') {
        const returnPhase = state.sourcePickerReturnPhase ?? 'hero';
        return {
          ...state,
          sourcePickerOpen: false,
          sourcePickerReturnPhase: null,
          phase: returnPhase,
        };
      }
      if (isCapturePhase(state.phase)) {
        return {
          ...state,
          phase: 'cancelled',
          captureDetail: 'Capture cancelled.',
          captureProgress: 0,
        };
      }
      if (state.fork.open) {
        return { ...state, fork: { ...state.fork, open: false } };
      }
      if (state.evidenceFocus) {
        return { ...state, evidenceFocus: null };
      }
      return state;
    }
    case 'SET_REDUCED_MOTION': {
      return { ...state, reducedMotion: event.value };
    }
    case 'SET_EVIDENCE_FOCUS': {
      return { ...state, evidenceFocus: event.focus };
    }
    case 'FIXTURE_ERROR': {
      return {
        ...state,
        fixtureError: event.message,
        phase: 'hero',
        resolveStartedAt: null,
        captureDetail: null,
        captureProgress: 0,
      };
    }
    case 'CLEAR_ERROR': {
      return { ...state, fixtureError: null };
    }
    case 'TOGGLE_BREAKTHROUGH': {
      return {
        ...state,
        breakthroughOpen:
          typeof event.open === 'boolean' ? event.open : !state.breakthroughOpen,
      };
    }
    default: {
      return state;
    }
  }
}
