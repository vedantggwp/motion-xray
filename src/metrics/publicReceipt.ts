import type { MotionReceipt, StepEvent } from '../fixtures/schema';
import { modelProvenance, type ModelProvenance } from '../live/modelProvenance';

/** Event fields safe for public download — no landmarks or media. */
export type PublicStepEvent = Pick<
  StepEvent,
  'side' | 'timestampMs' | 'confidence' | 'accepted' | 'rejectReason'
>;

/**
 * Deterministic receipt + provenance for Download receipt JSON.
 * Never includes frames, landmarks, pixels, file names, blobs, or object URLs.
 */
export type PublicReceiptExport = {
  fixtureId: string;
  source: MotionReceipt['source'];
  quality: MotionReceipt['quality'];
  events: PublicStepEvent[];
  left: MotionReceipt['left'];
  right: MotionReceipt['right'];
  deltaMs: number;
  deltaPct: number;
  kneeFlexion: MotionReceipt['kneeFlexion'];
  notEstablished: readonly string[];
  provenance: ModelProvenance;
};

const FORBIDDEN_KEYS = [
  'frames',
  'landmarks',
  'worldLandmarks',
  'blob',
  'objectURL',
  'objectUrl',
  'srcObject',
  'fileName',
  'filename',
  'videoName',
] as const;

export function buildPublicReceiptExport(receipt: MotionReceipt): PublicReceiptExport {
  return {
    fixtureId: receipt.fixtureId,
    source: receipt.source,
    quality: receipt.quality,
    events: receipt.events.map((event) => ({
      side: event.side,
      timestampMs: event.timestampMs,
      confidence: event.confidence,
      accepted: event.accepted,
      ...(event.rejectReason ? { rejectReason: event.rejectReason } : {}),
    })),
    left: receipt.left,
    right: receipt.right,
    deltaMs: receipt.deltaMs,
    deltaPct: receipt.deltaPct,
    kneeFlexion: receipt.kneeFlexion,
    notEstablished: receipt.notEstablished,
    provenance: modelProvenance(),
  };
}

/** Serialize public export and assert no forbidden raw-capture keys leak. */
export function serializePublicReceiptExport(receipt: MotionReceipt): string {
  const payload = buildPublicReceiptExport(receipt);
  const json = JSON.stringify(payload, null, 2);
  assertPublicReceiptSafe(json);
  return json;
}

export function assertPublicReceiptSafe(json: string): void {
  for (const key of FORBIDDEN_KEYS) {
    // Match JSON object keys only: "frames":
    const pattern = new RegExp(`"${key}"\\s*:`, 'i');
    if (pattern.test(json)) {
      throw new Error(`Public receipt export must not contain key "${key}"`);
    }
  }
  if (/blob:/i.test(json) || /objectURL/i.test(json)) {
    throw new Error('Public receipt export must not contain blob or object URLs');
  }
}

/**
 * Keep the temporary anchor and blob URL alive after click so headed Chromium /
 * automation can start the download. Review-5 zero-delay revoke still failed
 * the reproduced browser path; both resources are cleaned together after this delay.
 */
export const DOWNLOAD_CLEANUP_DELAY_MS = 1000;

export function downloadPublicReceiptJson(receipt: MotionReceipt): void {
  const json = serializePublicReceiptExport(receipt);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `motion-xray-receipt-${receipt.fixtureId}.json`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  // Do not remove the anchor or revoke the URL synchronously — headed Chromium
  // and agent-browser download can still need both after click.
  globalThis.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, DOWNLOAD_CLEANUP_DELAY_MS);
}
