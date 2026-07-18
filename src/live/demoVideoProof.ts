/**
 * Same-origin bundled MP4 loader for the one-click real-inference demo path.
 * Returns a browser File for the existing handleFile → FileCaptureSession pipeline.
 * Never embeds precomputed landmarks or receipt values.
 */

export const DEMO_VIDEO_PROOF_PATH = '/demo/mixkit-full-body-walk.mp4';

/** Stable fixture label for the real-video proof path (source remains local-video). */
export const DEMO_VIDEO_PROOF_LABEL = 'Independent full-body walk · real video proof';

/** Filename used when constructing the browser File (not stored in the public receipt). */
export const DEMO_VIDEO_PROOF_FILENAME = 'mixkit-full-body-walk.mp4';

export class DemoVideoProofError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoVideoProofError';
  }
}

/**
 * Fetch the bundled same-origin demo MP4 and return a non-empty video File.
 * Fails explicitly on non-OK, empty, or invalid responses — never invents a synthetic receipt.
 */
export async function loadDemoVideoProofFile(
  fetchImpl: typeof fetch = fetch,
): Promise<File> {
  let response: Response;
  try {
    response = await fetchImpl(DEMO_VIDEO_PROOF_PATH);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'network error';
    throw new DemoVideoProofError(
      `Real video proof asset could not be fetched (${DEMO_VIDEO_PROOF_PATH}): ${detail}`,
    );
  }

  if (!response.ok) {
    throw new DemoVideoProofError(
      `Real video proof asset unavailable (${DEMO_VIDEO_PROOF_PATH}): HTTP ${response.status}`,
    );
  }

  const blob = await response.blob();
  if (!blob || blob.size <= 0) {
    throw new DemoVideoProofError(
      `Real video proof asset empty or invalid (${DEMO_VIDEO_PROOF_PATH}).`,
    );
  }

  const type = blob.type && blob.type.startsWith('video/') ? blob.type : 'video/mp4';
  return new File([blob], DEMO_VIDEO_PROOF_FILENAME, { type });
}
