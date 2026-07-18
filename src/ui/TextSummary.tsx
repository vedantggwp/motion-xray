import { copy } from '../copy/copy';
import type { ReceiptDisplay } from '../metrics/receipt';

type Props = {
  phase: string;
  fixtureLabel: string;
  display: ReceiptDisplay | null;
  captureDetail?: string | null;
};

export function TextSummary({ phase, fixtureLabel, display, captureDetail }: Props) {
  let summary = `${copy.productName}. ${copy.trustLine} Current phase: ${phase}. Source: ${fixtureLabel}.`;

  if (captureDetail) {
    summary = `${summary} ${captureDetail}`;
  }

  if (display?.grade === 'insufficient') {
    summary = `${copy.abstentionTitle} ${copy.abstentionBody} Reason codes: ${display.reasonCodes}. Source: ${fixtureLabel}.`;
  } else if (display) {
    summary = `${copy.productName} receipt for ${fixtureLabel}. Left median same-side event interval ${display.leftMedianMs}. Right median same-side event interval ${display.rightMedianMs}. Paired delta ${display.deltaMs} (${display.deltaPct}). Left spread ${display.leftSpreadMs}. Right spread ${display.rightSpreadMs}. Left knee flexion range ${display.leftKneeRangeDeg}. Right knee flexion range ${display.rightKneeRangeDeg}. Accepted heel-low events ${display.acceptedCount}. Rejected heel-low events ${display.rejectedCount}. Mean foot visibility ${display.footVisibilityMean}. ${copy.bodyDiffFooter}`;
  }

  return (
    <section className="text-summary" aria-label={copy.textSummaryLabel}>
      <h2 className="sr-only">{copy.textSummaryLabel}</h2>
      <p role="status" aria-live="polite">
        {summary}
      </p>
    </section>
  );
}
