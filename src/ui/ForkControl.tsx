import { copy } from '../copy/copy';
import type { ForkDisplayModel } from '../metrics/fork';

type Props = {
  open: boolean;
  value: number;
  displayModel: ForkDisplayModel | null;
  onToggle: (open: boolean) => void;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function ForkControl({
  open,
  value,
  displayModel,
  onToggle,
  onChange,
  disabled,
}: Props) {
  return (
    <section className="fork-control" aria-label={copy.forkLabel}>
      <div className="fork-header">
        <h2 className="section-title">{copy.forkLabel}</h2>
        <button
          type="button"
          className="btn"
          aria-pressed={open}
          disabled={disabled}
          onClick={() => onToggle(!open)}
        >
          {open ? 'Close fork' : 'Open illustrative fork'}
        </button>
      </div>
      <p className="fork-disclaimer">{copy.forkDisclaimer}</p>
      {open && (
        <label className="fork-slider">
          <span>{copy.forkParameterLabel}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span className="mono">{value.toFixed(2)}</span>
          {displayModel && <span className="fork-retiming">{displayModel.label}</span>}
        </label>
      )}
    </section>
  );
}
