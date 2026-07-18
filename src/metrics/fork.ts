/**
 * Illustrative fork retimes only the ghost's right-side animation phase
 * toward the observed left median. It never mutates the receipt or observed rig.
 */
export function forkPhaseOffsetMs(
  leftMedianMs: number,
  rightMedianMs: number,
  forkValue: number,
): number {
  const clamped = Math.min(1, Math.max(0, forkValue));
  const delta = leftMedianMs - rightMedianMs;
  return delta * clamped;
}

export function ghostPlayheadMs(
  playheadMs: number,
  leftMedianMs: number,
  rightMedianMs: number,
  forkValue: number,
): number {
  return playheadMs + forkPhaseOffsetMs(leftMedianMs, rightMedianMs, forkValue);
}

export type ForkDisplayModel = {
  observedMs: number;
  currentMs: number;
  leftReferenceMs: number;
  label: string;
};

/**
 * Pure view model from receipt timing fields + slider value.
 * Components must not rederive receipt metrics ad hoc.
 */
export function buildForkDisplayModel(
  leftMedianMs: number,
  rightMedianMs: number,
  forkValue: number,
): ForkDisplayModel {
  const clamped = Math.min(1, Math.max(0, forkValue));
  const observedMs = rightMedianMs;
  const leftReferenceMs = leftMedianMs;
  const currentMs = observedMs + (leftReferenceMs - observedMs) * clamped;
  const label = `Illustrative retiming: right same-side interval ${Math.round(observedMs)} ms → ${Math.round(currentMs)} ms (left reference ${Math.round(leftReferenceMs)} ms).`;
  return {
    observedMs,
    currentMs,
    leftReferenceMs,
    label,
  };
}
