import { useEffect, useRef, useState } from 'react';

type Options = {
  durationMs: number;
  playing: boolean;
  reducedMotion: boolean;
  externalMs?: number;
};

export function useReplayClock({
  durationMs,
  playing,
  reducedMotion,
  externalMs,
}: Options): number {
  const [playheadMs, setPlayheadMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const lastExternal = useRef<number | undefined>(undefined);
  const playheadRef = useRef(0);

  useEffect(() => {
    if (typeof externalMs === 'number' && externalMs !== lastExternal.current) {
      lastExternal.current = externalMs;
      baseRef.current = externalMs;
      playheadRef.current = externalMs;
      setPlayheadMs(externalMs);
      startRef.current = null;
    }
  }, [externalMs]);

  useEffect(() => {
    if (!playing || durationMs <= 0) {
      startRef.current = null;
      return;
    }

    let frame = 0;
    const step = (now: number) => {
      if (startRef.current === null) {
        startRef.current = now;
      }
      const speed = reducedMotion ? 0.35 : 1;
      const elapsed = (now - startRef.current) * speed;
      const next = (baseRef.current + elapsed) % durationMs;
      playheadRef.current = next;
      setPlayheadMs(next);
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      baseRef.current = playheadRef.current;
      startRef.current = null;
    };
  }, [playing, durationMs, reducedMotion]);

  return playheadMs;
}
