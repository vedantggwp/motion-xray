import type { MotionFixture, MotionFrame, MotionSourceKind } from '../fixtures/schema';
import { validateFixture } from '../fixtures/schema';

function rebaseTimestamps(frames: MotionFrame[]): MotionFrame[] {
  if (frames.length === 0) {
    return frames;
  }
  const origin = frames[0].timestampMs;
  return frames.map((frame) => ({
    ...frame,
    timestampMs: Math.max(0, frame.timestampMs - origin),
  }));
}

function estimateFps(frames: MotionFrame[]): number {
  if (frames.length < 2) {
    return 30;
  }
  const duration = frames[frames.length - 1].timestampMs - frames[0].timestampMs;
  if (duration <= 0) {
    return 30;
  }
  return ((frames.length - 1) / duration) * 1000;
}

/** Build a MotionFixture from captured frames — never embeds pixels or blobs. */
export function buildCapturedFixture(options: {
  frames: MotionFrame[];
  source: Exclude<MotionSourceKind, 'synthetic-fixture'>;
  label?: string;
}): MotionFixture {
  const frames = rebaseTimestamps(options.frames);
  const id = `${options.source}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const label =
    options.label ??
    (options.source === 'live-camera' ? 'Live camera capture' : 'Local video capture');

  return validateFixture({
    id,
    label,
    source: options.source,
    fps: estimateFps(frames),
    frames,
  });
}

/** Assert a fixture/receipt payload never carries raw media. */
export function assertNoRawMedia(value: unknown, path = 'root'): void {
  if (value === null || value === undefined) {
    return;
  }
  if (typeof value === 'string') {
    if (value.startsWith('blob:') || value.startsWith('data:image') || value.startsWith('data:video')) {
      throw new Error(`${path} contains raw media URI`);
    }
    return;
  }
  if (typeof value !== 'object') {
    return;
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    throw new Error(`${path} contains Blob`);
  }
  if (typeof ImageData !== 'undefined' && value instanceof ImageData) {
    throw new Error(`${path} contains ImageData`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoRawMedia(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'pixels' || key === 'video' || key === 'imageData' || key === 'blob') {
      throw new Error(`${path}.${key} is forbidden media field`);
    }
    assertNoRawMedia(child, `${path}.${key}`);
  }
}
