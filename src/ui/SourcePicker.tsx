import { useEffect, useRef, useState } from 'react';
import { copy } from '../copy/copy';
import type { FixtureId } from '../fixtures/schema';
import { CAPTURE_PROTOCOL } from '../live/captureConstants';
import type { LiveStatus } from '../live/motionSource';

type Props = {
  open: boolean;
  liveStatus: LiveStatus;
  onRealVideoProof: () => void;
  onPick: (source: FixtureId) => void;
  onLive: () => void;
  onFile: (file: File) => void;
  onClose: () => void;
};

export function SourcePicker({
  open,
  liveStatus,
  onRealVideoProof,
  onPick,
  onLive,
  onFile,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const root = dialogRef.current;
    if (!root) {
      return;
    }
    const first = root.querySelector<HTMLButtonElement>('button.btn.primary, button.btn');
    first?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="source-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="source-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="handoff-header">
          <h2 id="source-title" className="section-title">
            Choose a source
          </h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="source-actions">
          <button type="button" className="btn primary" onClick={onRealVideoProof}>
            {copy.actions.runRealVideoProof}
          </button>
          <button type="button" className="btn" onClick={() => onPick('accepted-walk')}>
            {copy.actions.runBundled}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onPick('insufficient-evidence')}
          >
            {copy.actions.poorCapture}
          </button>
          <button type="button" className="btn ghost" onClick={onLive}>
            {copy.actions.liveCamera}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setFileError(null);
              fileRef.current?.click();
            }}
          >
            {copy.actions.localVideo}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                setFileError('No file selected.');
                return;
              }
              if (file.size <= 0) {
                setFileError('Empty file rejected.');
                return;
              }
              onFile(file);
            }}
          />
        </div>

        <section aria-label={copy.captureProtocolTitle}>
          <h3 className="section-title">{copy.captureProtocolTitle}</h3>
          <ul className="protocol-list">
            {CAPTURE_PROTOCOL.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        {liveStatus.kind === 'probing' && (
          <p role="status" aria-live="polite">
            {copy.liveProbing}
          </p>
        )}
        {liveStatus.kind === 'model-loading' && (
          <p role="status" aria-live="polite">
            {copy.modelLoading} {Math.round(liveStatus.progress * 100)}% — {liveStatus.detail}
          </p>
        )}
        {liveStatus.kind === 'unavailable' && (
          <p className="live-unavailable" role="status">
            {copy.liveUnavailable} {liveStatus.reason}
          </p>
        )}
        {fileError && (
          <p className="live-unavailable" role="alert">
            {fileError}
          </p>
        )}
      </div>
    </div>
  );
}
