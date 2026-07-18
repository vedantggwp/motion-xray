import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  DEMO_VIDEO_PROOF_FILENAME,
  DEMO_VIDEO_PROOF_LABEL,
  DEMO_VIDEO_PROOF_PATH,
  DemoVideoProofError,
  loadDemoVideoProofFile,
} from '../src/live/demoVideoProof';

const here = dirname(fileURLToPath(import.meta.url));
const loaderSource = readFileSync(join(here, '../src/live/demoVideoProof.ts'), 'utf8');

describe('demo video proof loader', () => {
  it('returns a non-empty MP4 File with the stable label/path contract', async () => {
    expect(DEMO_VIDEO_PROOF_PATH).toBe('/demo/mixkit-full-body-walk.mp4');
    expect(DEMO_VIDEO_PROOF_FILENAME).toBe('mixkit-full-body-walk.mp4');
    expect(DEMO_VIDEO_PROOF_LABEL).toBe('Independent full-body walk · real video proof');

    const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34]);
    const fetchImpl = vi.fn(async () =>
      new Response(bytes, {
        status: 200,
        headers: { 'Content-Type': 'video/mp4' },
      }),
    );

    const file = await loadDemoVideoProofFile(fetchImpl);

    expect(fetchImpl).toHaveBeenCalledWith(DEMO_VIDEO_PROOF_PATH);
    expect(file).toBeInstanceOf(File);
    expect(file.size).toBeGreaterThan(0);
    expect(file.name).toBe(DEMO_VIDEO_PROOF_FILENAME);
    expect(file.type).toBe('video/mp4');
    expect(file.name).not.toMatch(/accepted-walk|insufficient-evidence/);
  });

  it('fails explicitly on a non-OK response', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));

    await expect(loadDemoVideoProofFile(fetchImpl)).rejects.toBeInstanceOf(DemoVideoProofError);
    await expect(loadDemoVideoProofFile(fetchImpl)).rejects.toThrow(/HTTP 404/);
  });

  it('fails explicitly on an empty response body', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(new Uint8Array(), {
          status: 200,
          headers: { 'Content-Type': 'video/mp4' },
        }),
    );

    await expect(loadDemoVideoProofFile(fetchImpl)).rejects.toBeInstanceOf(DemoVideoProofError);
    await expect(loadDemoVideoProofFile(fetchImpl)).rejects.toThrow(/empty or invalid/);
  });

  it('does not involve a precomputed receipt or landmark fixture', () => {
    expect(loaderSource).not.toMatch(/accepted-walk|insufficient-evidence/);
    expect(loaderSource).not.toMatch(/loadFixture|computeReceipt|landmarks\s*:/);
    expect(loaderSource).not.toMatch(/from ['"].*fixtures|from ['"].*metrics/);
    expect(loaderSource).toMatch(/return new File/);
  });
});
