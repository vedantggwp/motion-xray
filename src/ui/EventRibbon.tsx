import { copy } from '../copy/copy';
import type { MotionReceipt } from '../fixtures/schema';

type Props = {
  receipt: MotionReceipt;
  playheadMs: number;
  durationMs: number;
  onScrub: (ms: number) => void;
};

export function EventRibbon({ receipt, playheadMs, durationMs, onScrub }: Props) {
  const accepted = receipt.events.filter((event) => event.accepted);

  return (
    <section className="event-ribbon" aria-label={copy.eventRibbonLabel}>
      <div className="ribbon-track" role="presentation">
        {accepted.map((event) => {
          const left = durationMs <= 0 ? 0 : (event.timestampMs / durationMs) * 100;
          return (
            <span
              key={`${event.side}-${event.timestampMs}`}
              className={`ribbon-mark ${event.side}`}
              style={{ left: `${left}%` }}
              title={`${event.side} · ${Math.round(event.timestampMs)} ms`}
            />
          );
        })}
        <span
          className="ribbon-playhead"
          style={{ left: `${durationMs <= 0 ? 0 : (playheadMs / durationMs) * 100}%` }}
        />
      </div>
      <label className="scrubber">
        <span className="sr-only">{copy.scrubberLabel}</span>
        <input
          type="range"
          min={0}
          max={durationMs}
          step={16}
          value={Math.min(playheadMs, durationMs)}
          onChange={(event) => onScrub(Number(event.target.value))}
          aria-valuetext={`${Math.round(playheadMs)} milliseconds`}
        />
        <span className="mono scrubber-value">{Math.round(playheadMs)} ms</span>
      </label>
    </section>
  );
}
