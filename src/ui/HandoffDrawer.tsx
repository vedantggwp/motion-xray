import { useEffect, useRef } from 'react';
import { copy } from '../copy/copy';
import type { MotionReceipt } from '../fixtures/schema';
import {
  MEDIAPIPE_PACKAGE,
  MEDIAPIPE_PACKAGE_VERSION,
  POSE_LANDMARKER_MODEL_ID,
  POSE_LANDMARKER_MODEL_SHA256,
} from '../live/modelProvenance';
import { formatReceiptDisplay } from '../metrics/receipt';

export type HandoffViewModel = {
  grade: string;
  sourceKind: string;
  fixtureId: string;
  durationMs: string;
  sampledFrameCount: string;
  posePresenceRate: string;
  walkingCondition: string;
  footwearSurface: string;
  typicalForPerson: string;
  professionalSignOff: string;
  leftMedianMs: string;
  rightMedianMs: string;
  deltaMs: string;
  deltaPct: string;
  leftSpreadMs: string;
  rightSpreadMs: string;
  footVisibilityMean: string;
  acceptedCount: string;
  rejectedCount: string;
  leftKneeRangeDeg: string;
  rightKneeRangeDeg: string;
  frameGaps: string;
  teleportFrames: string;
  intervalCvLeft: string;
  intervalCvRight: string;
  alternationScore: string;
  reasonCodes: string;
  normativeComparison: string;
  repeatability: string;
  notEstablished: readonly string[];
  mediapipePackage: string;
  modelId: string;
  modelSha256: string;
  receiptMethod: string;
};

type Props = {
  open: boolean;
  receipt: MotionReceipt;
  onClose: () => void;
};

function formatCv(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return value.toFixed(3);
}

/** Maps every dynamic report token to a receipt or formatted display field. */
export function buildHandoffViewModel(receipt: MotionReceipt): HandoffViewModel {
  const display = formatReceiptDisplay(receipt);
  const q = receipt.quality;
  const reasonCodes =
    q.reasonCodes.length > 0 ? q.reasonCodes.join(', ') : copy.measurementNone;

  return {
    grade: display.grade,
    sourceKind: receipt.source,
    fixtureId: receipt.fixtureId,
    durationMs: `${Math.round(q.durationMs)} ms`,
    sampledFrameCount: String(q.sampledFrameCount),
    posePresenceRate: q.posePresenceRate.toFixed(3),
    walkingCondition: copy.reportValues.notCollected,
    footwearSurface: copy.reportValues.notCollected,
    typicalForPerson: copy.reportValues.notConfirmed,
    professionalSignOff: copy.reportValues.notPerformed,
    leftMedianMs: display.leftMedianMs,
    rightMedianMs: display.rightMedianMs,
    deltaMs: display.deltaMs,
    deltaPct: display.deltaPct,
    leftSpreadMs: display.leftSpreadMs,
    rightSpreadMs: display.rightSpreadMs,
    footVisibilityMean: display.footVisibilityMean,
    acceptedCount: display.acceptedCount,
    rejectedCount: display.rejectedCount,
    leftKneeRangeDeg: display.leftKneeRangeDeg,
    rightKneeRangeDeg: display.rightKneeRangeDeg,
    frameGaps: display.frameGaps,
    teleportFrames: String(q.teleportFrameCount),
    intervalCvLeft: formatCv(q.intervalCvLeft),
    intervalCvRight: formatCv(q.intervalCvRight),
    alternationScore: q.alternationScore.toFixed(3),
    reasonCodes,
    normativeComparison: copy.reportValues.normativeComparison,
    repeatability: copy.reportValues.repeatability,
    notEstablished: receipt.notEstablished,
    mediapipePackage: `${MEDIAPIPE_PACKAGE}@${MEDIAPIPE_PACKAGE_VERSION}`,
    modelId: POSE_LANDMARKER_MODEL_ID,
    modelSha256: POSE_LANDMARKER_MODEL_SHA256,
    receiptMethod: copy.reportValues.receiptMethod,
  };
}

export function HandoffDrawer({ open, receipt, onClose }: Props) {
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

  const model = buildHandoffViewModel(receipt);

  return (
    <div className="handoff-backdrop" role="presentation" onClick={onClose}>
      <aside
        ref={drawerRef}
        className="handoff-drawer handoff-report"
        role="dialog"
        aria-modal="true"
        aria-labelledby="handoff-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="handoff-header handoff-no-print">
          <p className="eyebrow">{copy.productName}</p>
          <div className="handoff-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                window.print();
              }}
            >
              {copy.actions.printReport}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              {copy.actions.closeHandoff}
            </button>
          </div>
        </div>

        <header className="report-header">
          <h2 id="handoff-title" className="handoff-headline">
            {copy.reportTitle}
          </h2>
          <p className="report-badge">{copy.reportBadge}</p>
          <p className="report-intro">{copy.reportIntro}</p>
        </header>

        <section aria-label={copy.reportSections.captureRecord}>
          <h3 className="section-title">{copy.reportSections.captureRecord}</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>{copy.reportFields.captureStatus}</dt>
              <dd className="mono">{model.grade}</dd>
            </div>
            <div>
              <dt>{copy.sourceKind}</dt>
              <dd className="mono">{model.sourceKind}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.traceId}</dt>
              <dd className="mono">{model.fixtureId}</dd>
            </div>
            <div>
              <dt>{copy.durationMs}</dt>
              <dd className="mono">{model.durationMs}</dd>
            </div>
            <div>
              <dt>{copy.sampledFrameCount}</dt>
              <dd className="mono">{model.sampledFrameCount}</dd>
            </div>
            <div>
              <dt>{copy.posePresenceRate}</dt>
              <dd className="mono">{model.posePresenceRate}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.walkingCondition}</dt>
              <dd className="mono">{model.walkingCondition}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.footwearSurface}</dt>
              <dd className="mono">{model.footwearSurface}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.typicalForPerson}</dt>
              <dd className="mono">{model.typicalForPerson}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.professionalSignOff}</dt>
              <dd className="mono">{model.professionalSignOff}</dd>
            </div>
          </dl>
        </section>

        <section aria-label={copy.reportSections.observedMeasures}>
          <h3 className="section-title">{copy.reportSections.observedMeasures}</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>{copy.reportFields.leftMedian}</dt>
              <dd className="mono">{model.leftMedianMs}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.rightMedian}</dt>
              <dd className="mono">{model.rightMedianMs}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.pairedDelta}</dt>
              <dd className="mono">
                {model.deltaMs} · {model.deltaPct}
              </dd>
            </div>
            <div>
              <dt>{copy.reportFields.leftSpread}</dt>
              <dd className="mono">{model.leftSpreadMs}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.rightSpread}</dt>
              <dd className="mono">{model.rightSpreadMs}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.acceptedEstimates}</dt>
              <dd className="mono">{model.acceptedCount}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.rejectedEstimates}</dt>
              <dd className="mono">{model.rejectedCount}</dd>
            </div>
            <div>
              <dt>{copy.footVisibility}</dt>
              <dd className="mono">{model.footVisibilityMean}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.leftKneeRange}</dt>
              <dd className="mono">{model.leftKneeRangeDeg}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.rightKneeRange}</dt>
              <dd className="mono">{model.rightKneeRangeDeg}</dd>
            </div>
          </dl>
        </section>

        <section aria-label={copy.reportSections.evidenceQuality}>
          <h3 className="section-title">{copy.reportSections.evidenceQuality}</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>{copy.frameGaps}</dt>
              <dd className="mono">{model.frameGaps}</dd>
            </div>
            <div>
              <dt>{copy.teleportFrames}</dt>
              <dd className="mono">{model.teleportFrames}</dd>
            </div>
            <div>
              <dt>{copy.intervalCvLeft}</dt>
              <dd className="mono">{model.intervalCvLeft}</dd>
            </div>
            <div>
              <dt>{copy.intervalCvRight}</dt>
              <dd className="mono">{model.intervalCvRight}</dd>
            </div>
            <div>
              <dt>{copy.alternationScore}</dt>
              <dd className="mono">{model.alternationScore}</dd>
            </div>
            <div>
              <dt>{copy.reasonCodes}</dt>
              <dd className="mono">{model.reasonCodes}</dd>
            </div>
          </dl>
        </section>

        <section aria-label={copy.reportSections.interpretationBoundary}>
          <h3 className="section-title">{copy.reportSections.interpretationBoundary}</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>{copy.reportFields.normativeComparison}</dt>
              <dd>{model.normativeComparison}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.repeatability}</dt>
              <dd>{model.repeatability}</dd>
            </div>
          </dl>
          <p className="report-boundary-note">
            <strong>{copy.reportFields.notEstablishedHeading}</strong>
            {': '}
            {copy.notEstablished}
          </p>
          <ul className="not-established">
            {model.notEstablished.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-label={copy.reportSections.questions}>
          <h3 className="section-title">{copy.reportSections.questions}</h3>
          <ol className="handoff-questions">
            {copy.handoffQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </section>

        <section aria-label={copy.reportSections.methodProvenance}>
          <h3 className="section-title">{copy.reportSections.methodProvenance}</h3>
          <dl className="metric-grid compact">
            <div>
              <dt>{copy.reportFields.mediapipePackage}</dt>
              <dd className="mono">{model.mediapipePackage}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.modelIdentity}</dt>
              <dd className="mono">{model.modelId}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.modelSha256}</dt>
              <dd className="mono sha">{model.modelSha256}</dd>
            </div>
            <div>
              <dt>{copy.reportFields.receiptMethod}</dt>
              <dd className="mono">{model.receiptMethod}</dd>
            </div>
          </dl>
        </section>

        <div className="handoff-actions handoff-actions-footer handoff-no-print">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              window.print();
            }}
          >
            {copy.actions.printReport}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            {copy.actions.closeHandoff}
          </button>
        </div>
      </aside>
    </div>
  );
}
