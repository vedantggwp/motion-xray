import { copy } from '../copy/copy';
import type { MotionReceipt } from '../fixtures/schema';
import {
  MEDIAPIPE_PACKAGE,
  MEDIAPIPE_PACKAGE_VERSION,
  POSE_LANDMARKER_MODEL_ID,
  POSE_LANDMARKER_MODEL_SHA256,
} from '../live/modelProvenance';
import { downloadPublicReceiptJson } from '../metrics/publicReceipt';

type Props = {
  receipt: MotionReceipt;
  /** Development-only full fixture download; omit in production. */
  onDownloadDevFixture?: () => void;
};

function formatCv(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞';
  }
  return value.toFixed(3);
}

export function MeasurementReceipt({ receipt, onDownloadDevFixture }: Props) {
  const q = receipt.quality;
  const reasonCodes =
    q.reasonCodes.length > 0 ? q.reasonCodes.join(', ') : copy.measurementNone;

  return (
    <details className="measurement-receipt">
      <summary className="measurement-receipt-summary">{copy.measurementReceiptTitle}</summary>
      <div className="measurement-receipt-body">
        <p className="measurement-receipt-note">{copy.measurementReceiptNote}</p>
        <dl className="metric-grid compact">
          <div>
            <dt>{copy.captureGate}</dt>
            <dd className="mono">{q.grade}</dd>
          </div>
          <div>
            <dt>{copy.reasonCodes}</dt>
            <dd className="mono">{reasonCodes}</dd>
          </div>
          <div>
            <dt>{copy.sourceKind}</dt>
            <dd className="mono">{receipt.source}</dd>
          </div>
          <div>
            <dt>{copy.fixtureIdLabel}</dt>
            <dd className="mono">{receipt.fixtureId}</dd>
          </div>
          <div>
            <dt>{copy.sampledFrameCount}</dt>
            <dd className="mono">{q.sampledFrameCount}</dd>
          </div>
          <div>
            <dt>{copy.durationMs}</dt>
            <dd className="mono">{Math.round(q.durationMs)} ms</dd>
          </div>
          <div>
            <dt>{copy.posePresenceRate}</dt>
            <dd className="mono">{q.posePresenceRate.toFixed(3)}</dd>
          </div>
          <div>
            <dt>{copy.footVisibility}</dt>
            <dd className="mono">{q.footVisibilityMean.toFixed(3)}</dd>
          </div>
          <div>
            <dt>{copy.frameGaps}</dt>
            <dd className="mono">{q.frameGaps}</dd>
          </div>
          <div>
            <dt>{copy.teleportFrames}</dt>
            <dd className="mono">{q.teleportFrameCount}</dd>
          </div>
          <div>
            <dt>{copy.candidateHeelLowLeft}</dt>
            <dd className="mono">{q.leftCandidateCount}</dd>
          </div>
          <div>
            <dt>{copy.candidateHeelLowRight}</dt>
            <dd className="mono">{q.rightCandidateCount}</dd>
          </div>
          <div>
            <dt>{copy.acceptedHeelLowLeft}</dt>
            <dd className="mono">{q.leftAcceptedCount}</dd>
          </div>
          <div>
            <dt>{copy.acceptedHeelLowRight}</dt>
            <dd className="mono">{q.rightAcceptedCount}</dd>
          </div>
          <div>
            <dt>{copy.rejectedLowVisibilityLeft}</dt>
            <dd className="mono">{q.rejectedByReason.left['low-visibility']}</dd>
          </div>
          <div>
            <dt>{copy.rejectedLowVisibilityRight}</dt>
            <dd className="mono">{q.rejectedByReason.right['low-visibility']}</dd>
          </div>
          <div>
            <dt>{copy.rejectedDiscontinuityLeft}</dt>
            <dd className="mono">{q.rejectedByReason.left.discontinuity}</dd>
          </div>
          <div>
            <dt>{copy.rejectedDiscontinuityRight}</dt>
            <dd className="mono">{q.rejectedByReason.right.discontinuity}</dd>
          </div>
          <div>
            <dt>{copy.intervalCvLeft}</dt>
            <dd className="mono">{formatCv(q.intervalCvLeft)}</dd>
          </div>
          <div>
            <dt>{copy.intervalCvRight}</dt>
            <dd className="mono">{formatCv(q.intervalCvRight)}</dd>
          </div>
          <div>
            <dt>{copy.alternationScore}</dt>
            <dd className="mono">{q.alternationScore.toFixed(3)}</dd>
          </div>
          <div>
            <dt>{copy.mediapipePackage}</dt>
            <dd className="mono">
              {MEDIAPIPE_PACKAGE}@{MEDIAPIPE_PACKAGE_VERSION}
            </dd>
          </div>
          <div>
            <dt>{copy.modelIdentity}</dt>
            <dd className="mono">{POSE_LANDMARKER_MODEL_ID}</dd>
          </div>
          <div>
            <dt>{copy.modelSha256}</dt>
            <dd className="mono sha">{POSE_LANDMARKER_MODEL_SHA256}</dd>
          </div>
        </dl>

        <div className="measurement-receipt-actions">
          <button
            type="button"
            className="btn"
            onClick={() => downloadPublicReceiptJson(receipt)}
          >
            {copy.actions.downloadReceiptJson}
          </button>
          {onDownloadDevFixture && (
            <button type="button" className="btn ghost" onClick={onDownloadDevFixture}>
              {copy.actions.downloadDevFixture}
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
