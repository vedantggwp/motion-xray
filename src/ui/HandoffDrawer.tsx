import { useEffect, useRef } from 'react';
import { copy } from '../copy/copy';
import type { ReceiptDisplay } from '../metrics/receipt';

export type HandoffViewModel = {
  leftMedianMs: string;
  rightMedianMs: string;
  deltaMs: string;
  deltaPct: string;
  leftSpreadMs: string;
  rightSpreadMs: string;
  footVisibilityMean: string;
  acceptedCount: string;
  rejectedCount: string;
  grade: string;
  leftKneeRangeDeg: string;
  rightKneeRangeDeg: string;
};

type Props = {
  open: boolean;
  display: ReceiptDisplay;
  onClose: () => void;
};

/** Maps every numeric handoff token to a formatted receipt display field. */
export function buildHandoffViewModel(display: ReceiptDisplay): HandoffViewModel {
  return {
    leftMedianMs: display.leftMedianMs,
    rightMedianMs: display.rightMedianMs,
    deltaMs: display.deltaMs,
    deltaPct: display.deltaPct,
    leftSpreadMs: display.leftSpreadMs,
    rightSpreadMs: display.rightSpreadMs,
    footVisibilityMean: display.footVisibilityMean,
    acceptedCount: display.acceptedCount,
    rejectedCount: display.rejectedCount,
    grade: display.grade,
    leftKneeRangeDeg: display.leftKneeRangeDeg,
    rightKneeRangeDeg: display.rightKneeRangeDeg,
  };
}

export function HandoffDrawer({ open, display, onClose }: Props) {
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const root = drawerRef.current;
    if (!root) {
      return;
    }
    const first = root.querySelector<HTMLButtonElement>('button');
    first?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  const model = buildHandoffViewModel(display);

  return (
    <div className="handoff-backdrop" role="presentation" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="handoff-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="handoff-header">
          <h2 id="handoff-title" className="handoff-headline">
            {copy.handoffHeadline}
          </h2>
          <button type="button" className="btn" onClick={onClose}>
            {copy.actions.closeHandoff}
          </button>
        </div>

        <ol className="handoff-questions">
          {copy.handoffQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>

        <section aria-label="Source values">
          <h3 className="section-title">Source values</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>Left median same-side event interval</dt>
              <dd className="mono">{model.leftMedianMs}</dd>
            </div>
            <div>
              <dt>Right median same-side event interval</dt>
              <dd className="mono">{model.rightMedianMs}</dd>
            </div>
            <div>
              <dt>Delta</dt>
              <dd className="mono">
                {model.deltaMs} · {model.deltaPct}
              </dd>
            </div>
            <div>
              <dt>Left spread</dt>
              <dd className="mono">{model.leftSpreadMs}</dd>
            </div>
            <div>
              <dt>Right spread</dt>
              <dd className="mono">{model.rightSpreadMs}</dd>
            </div>
            <div>
              <dt>Left knee flexion range (camera-plane estimate)</dt>
              <dd className="mono">{model.leftKneeRangeDeg}</dd>
            </div>
            <div>
              <dt>Right knee flexion range (camera-plane estimate)</dt>
              <dd className="mono">{model.rightKneeRangeDeg}</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Capture quality">
          <h3 className="section-title">Capture quality</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>Grade</dt>
              <dd className="mono">{model.grade}</dd>
            </div>
            <div>
              <dt>Foot visibility</dt>
              <dd className="mono">{model.footVisibilityMean}</dd>
            </div>
            <div>
              <dt>Accepted</dt>
              <dd className="mono">{model.acceptedCount}</dd>
            </div>
            <div>
              <dt>Rejected</dt>
              <dd className="mono">{model.rejectedCount}</dd>
            </div>
          </dl>
        </section>

        <section aria-label="Not established">
          <h3 className="section-title">Not established</h3>
          <p>{copy.notEstablished}</p>
          <ul className="not-established">
            {copy.notEstablishedList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
