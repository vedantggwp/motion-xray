import type { SideTiming, StepEvent } from '../fixtures/schema';

function median(sorted: number[]): number {
  if (sorted.length === 0) {
    return 0;
  }
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function interquartileRange(sorted: number[]): number {
  if (sorted.length < 2) {
    return 0;
  }
  const q1Index = Math.floor((sorted.length - 1) * 0.25);
  const q3Index = Math.floor((sorted.length - 1) * 0.75);
  return sorted[q3Index] - sorted[q1Index];
}

export function sameSideIntervals(events: StepEvent[], side: 'left' | 'right'): number[] {
  const accepted = events
    .filter((event) => event.side === side && event.accepted)
    .map((event) => event.timestampMs)
    .sort((a, b) => a - b);

  const intervals: number[] = [];
  for (let i = 1; i < accepted.length; i += 1) {
    intervals.push(accepted[i] - accepted[i - 1]);
  }
  return intervals;
}

export function computeSideTiming(events: StepEvent[], side: 'left' | 'right'): SideTiming {
  const intervalsMs = sameSideIntervals(events, side);
  const sorted = [...intervalsMs].sort((a, b) => a - b);
  return {
    intervalsMs,
    medianMs: median(sorted),
    spreadMs: interquartileRange(sorted),
  };
}

export function computeDelta(leftMedianMs: number, rightMedianMs: number): {
  deltaMs: number;
  deltaPct: number;
} {
  const deltaMs = rightMedianMs - leftMedianMs;
  const mean = (leftMedianMs + rightMedianMs) / 2;
  const deltaPct = mean === 0 ? 0 : (deltaMs / mean) * 100;
  return { deltaMs, deltaPct };
}
