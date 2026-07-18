import { copy } from '../copy/copy';

type Focus =
  | 'recorded'
  | 'estimated'
  | 'calculated'
  | 'illustrative'
  | 'research'
  | 'unavailable'
  | null;

type Props = {
  focus: Focus;
  onFocus: (focus: Focus) => void;
};

const ORDER = [
  'recorded',
  'estimated',
  'calculated',
  'illustrative',
  'unavailable',
] as const;

export function EvidenceLegend({ focus, onFocus }: Props) {
  return (
    <section className="evidence-legend" aria-label={copy.evidenceLensLabel}>
      <h2 className="section-title">{copy.evidenceLensLabel}</h2>
      <ul className="evidence-list">
        {ORDER.map((id) => {
          const item = copy.evidenceClasses[id];
          const active = focus === id;
          return (
            <li key={id}>
              <button
                type="button"
                className={`evidence-chip evidence-${id}${active ? ' active' : ''}`}
                aria-pressed={active}
                onClick={() => onFocus(id)}
                onMouseEnter={() => onFocus(id)}
                onMouseLeave={(event) => {
                  if (event.currentTarget !== document.activeElement) {
                    onFocus(null);
                  }
                }}
                onFocus={() => onFocus(id)}
                onBlur={() => onFocus(null)}
              >
                <span className="evidence-swatch" aria-hidden="true" />
                <span className="evidence-copy">
                  <span className="evidence-label">{item.label}</span>
                  <span className="evidence-desc">{item.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {focus && focus !== 'research' && (
        <p className="evidence-focus-detail" role="status">
          {copy.evidenceClasses[focus].description}
        </p>
      )}
    </section>
  );
}
