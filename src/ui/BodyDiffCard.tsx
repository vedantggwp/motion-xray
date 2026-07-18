import { copy } from '../copy/copy';
import type { ReceiptDisplay } from '../metrics/receipt';

type Props = {
  display: ReceiptDisplay;
};

export function BodyDiffCard({ display }: Props) {
  return (
    <section className="body-diff" aria-label={copy.bodyDiffLabel}>
      <h2 className="section-title">{copy.bodyDiffLabel}</h2>
      <dl className="metric-grid">
        <div>
          <dt>
            {copy.leftLabel} · {copy.medianInterval}
          </dt>
          <dd className="mono">{display.leftMedianMs}</dd>
        </div>
        <div>
          <dt>
            {copy.rightLabel} · {copy.medianInterval}
          </dt>
          <dd className="mono">{display.rightMedianMs}</dd>
        </div>
        <div>
          <dt>
            {copy.leftLabel} · {copy.spread}
          </dt>
          <dd className="mono">{display.leftSpreadMs}</dd>
        </div>
        <div>
          <dt>
            {copy.rightLabel} · {copy.spread}
          </dt>
          <dd className="mono">{display.rightSpreadMs}</dd>
        </div>
        <div>
          <dt>{copy.delta}</dt>
          <dd className="mono">
            {display.deltaMs} · {display.deltaPct}
          </dd>
        </div>
        <div>
          <dt>{copy.quality}</dt>
          <dd className="mono">{display.grade}</dd>
        </div>
        <div>
          <dt>{copy.acceptedEvents}</dt>
          <dd className="mono">{display.acceptedCount}</dd>
        </div>
        <div>
          <dt>{copy.rejectedEvents}</dt>
          <dd className="mono">{display.rejectedCount}</dd>
        </div>
        <div>
          <dt>{copy.footVisibility}</dt>
          <dd className="mono">{display.footVisibilityMean}</dd>
        </div>
        <div>
          <dt>
            {copy.leftLabel} · {display.kneeFlexionLabel}
          </dt>
          <dd className="mono">{display.leftKneeRangeDeg}</dd>
        </div>
        <div>
          <dt>
            {copy.rightLabel} · {display.kneeFlexionLabel}
          </dt>
          <dd className="mono">{display.rightKneeRangeDeg}</dd>
        </div>
      </dl>
      <p className="body-diff-footer">{copy.bodyDiffFooter}</p>
    </section>
  );
}
