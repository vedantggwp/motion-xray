/**
 * Pure graph-clock helper for MediaPipe VIDEO mode.
 *
 * Media/sample timestamps may restart at zero when a new camera/file source
 * begins. The shared PoseLandmarker graph requires strictly increasing
 * inference timestamps for its lifetime. Callers keep media time on MotionFrame.
 *
 * After a media reset, within-source media deltas are preserved via an offset
 * (e.g. prior graph end 150 + new media [0,50,100] → graph [151,201,251]).
 */

export type InferenceClockState = {
  lastGraphTimestampMs: number;
  lastMediaTimestampMs: number;
  offsetMs: number;
};

export function createInferenceClockState(): InferenceClockState {
  return {
    lastGraphTimestampMs: -1,
    lastMediaTimestampMs: -1,
    offsetMs: 0,
  };
}

/**
 * Advance the graph clock one media sample.
 * Returns the graph timestamp to pass to MediaPipe and the next clock state.
 */
export function advanceInferenceClock(
  state: InferenceClockState,
  mediaTimestampMs: number,
): { graphTimestampMs: number; state: InferenceClockState } {
  const media = Number.isFinite(mediaTimestampMs) ? Math.max(0, mediaTimestampMs) : 0;

  if (!Number.isFinite(state.lastGraphTimestampMs) || state.lastGraphTimestampMs < 0) {
    const graphTimestampMs = media;
    return {
      graphTimestampMs,
      state: {
        lastGraphTimestampMs: graphTimestampMs,
        lastMediaTimestampMs: media,
        offsetMs: 0,
      },
    };
  }

  let offsetMs = Number.isFinite(state.offsetMs) ? state.offsetMs : 0;
  const mediaReset =
    Number.isFinite(state.lastMediaTimestampMs) &&
    state.lastMediaTimestampMs >= 0 &&
    media < state.lastMediaTimestampMs;

  let graphTimestampMs = media + offsetMs;
  if (mediaReset || graphTimestampMs <= state.lastGraphTimestampMs) {
    offsetMs = state.lastGraphTimestampMs + 1 - media;
    graphTimestampMs = media + offsetMs;
  }

  return {
    graphTimestampMs,
    state: {
      lastGraphTimestampMs: graphTimestampMs,
      lastMediaTimestampMs: media,
      offsetMs,
    },
  };
}

/**
 * One-shot helper: next graph timestamp given prior graph/media/offset.
 * Prefer {@link InferenceClock} or {@link advanceInferenceClock} when chaining.
 */
export function nextInferenceTimestamp(
  lastGraphTimestampMs: number,
  mediaTimestampMs: number,
  lastMediaTimestampMs = -1,
  offsetMs = 0,
): number {
  return advanceInferenceClock(
    { lastGraphTimestampMs, lastMediaTimestampMs, offsetMs },
    mediaTimestampMs,
  ).graphTimestampMs;
}

/** Stateful wrapper around {@link advanceInferenceClock}. */
export class InferenceClock {
  private state: InferenceClockState = createInferenceClockState();

  /** Allocate the next graph timestamp; does not mutate media time. */
  next(mediaTimestampMs: number): number {
    const advanced = advanceInferenceClock(this.state, mediaTimestampMs);
    this.state = advanced.state;
    return advanced.graphTimestampMs;
  }

  /** Current last allocated graph timestamp, or -1 before the first call. */
  peekLast(): number {
    return this.state.lastGraphTimestampMs;
  }

  reset(): void {
    this.state = createInferenceClockState();
  }
}
