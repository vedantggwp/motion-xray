import { copy } from '../copy/copy';
import type { MotionSourceKind } from '../fixtures/schema';

type Props = {
  source: MotionSourceKind;
  fixtureId: string;
  breakthroughOpen: boolean;
  onToggleBreakthrough: () => void;
};

export function ProvenanceStrip({
  source,
  fixtureId,
  breakthroughOpen,
  onToggleBreakthrough,
}: Props) {
  const chain =
    source === 'live-camera'
      ? copy.provenanceLive
      : source === 'local-video'
        ? copy.provenanceLocalVideo
        : copy.provenanceFixture;

  return (
    <footer className="provenance">
      <p className="mono">
        {chain}
        {' · '}
        fixture/{fixtureId}
        {' · '}
        {copy.safetyLine}
      </p>
      <button
        type="button"
        className="btn ghost breakthrough-toggle"
        aria-expanded={breakthroughOpen}
        onClick={onToggleBreakthrough}
      >
        {copy.breakthroughTitle}
      </button>
      {breakthroughOpen && (
        <div className="breakthrough" role="region" aria-label={copy.breakthroughTitle}>
          <p>{copy.breakthroughBody}</p>
          <ul>
            {copy.breakthroughLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </footer>
  );
}
