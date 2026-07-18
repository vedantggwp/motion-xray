import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import insufficient from '../src/fixtures/insufficient-evidence.json';
import { validateFixture } from '../src/fixtures/schema';
import {
  POSE_LANDMARKER_MODEL_SHA256,
  MEDIAPIPE_PACKAGE,
  MEDIAPIPE_PACKAGE_VERSION,
} from '../src/live/modelProvenance';
import { computeReceipt } from '../src/metrics/receipt';
import {
  DOWNLOAD_CLEANUP_DELAY_MS,
  assertPublicReceiptSafe,
  buildPublicReceiptExport,
  downloadPublicReceiptJson,
  serializePublicReceiptExport,
} from '../src/metrics/publicReceipt';

describe('public receipt download', () => {
  it('contains provenance and evidence without frames, landmarks, or media URLs', () => {
    const receipt = computeReceipt(validateFixture(accepted));
    const exported = buildPublicReceiptExport(receipt);
    const json = serializePublicReceiptExport(receipt);

    expect(exported.fixtureId).toBe('accepted-walk');
    expect(exported.source).toBe('synthetic-fixture');
    expect(exported.quality.sampledFrameCount).toBeGreaterThan(0);
    expect(exported.quality.leftAcceptedCount).toBeGreaterThanOrEqual(5);
    expect(exported.provenance.mediapipePackage).toBe(MEDIAPIPE_PACKAGE);
    expect(exported.provenance.mediapipePackageVersion).toBe(MEDIAPIPE_PACKAGE_VERSION);
    expect(exported.provenance.modelSha256).toBe(POSE_LANDMARKER_MODEL_SHA256);

    expect(json).not.toMatch(/"frames"\s*:/);
    expect(json).not.toMatch(/"landmarks"\s*:/);
    expect(json).not.toMatch(/"worldLandmarks"\s*:/);
    expect(json).not.toMatch(/blob:/i);
    expect(json).not.toMatch(/objectURL/i);
    expect(json).not.toMatch(/"fileName"\s*:/i);
    expect(json).not.toMatch(/"filename"\s*:/i);
    expect(json).not.toMatch(/"videoName"\s*:/i);
    assertPublicReceiptSafe(json);

    // Structural: export object itself has no frames/landmarks keys.
    expect(exported).not.toHaveProperty('frames');
    expect(exported).not.toHaveProperty('landmarks');
  });

  it('still exports capture evidence when the capture gate abstains', () => {
    const receipt = computeReceipt(validateFixture(insufficient));
    const exported = buildPublicReceiptExport(receipt);
    expect(exported.quality.grade).toBe('insufficient');
    expect(exported.quality.reasonCodes.length).toBeGreaterThan(0);
    expect(exported.quality.sampledFrameCount).toBeGreaterThan(0);
    expect(exported.kneeFlexion.left).toBeNull();
    expect(exported.kneeFlexion.right).toBeNull();
    assertPublicReceiptSafe(serializePublicReceiptExport(receipt));
  });

  describe('download blob URL lifecycle', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('appends, clicks, then removes anchor and revokes URL only after the delay', () => {
      vi.useFakeTimers();

      const blobUrl = 'blob:motion-xray-test-receipt';
      const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue(blobUrl);
      const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

      const click = vi.fn();
      const remove = vi.fn();
      const appendChild = vi.fn();
      const anchor = {
        href: '',
        download: '',
        rel: '',
        click,
        remove,
      };

      const createElement = vi.fn((tag: string) => {
        expect(tag).toBe('a');
        return anchor;
      });

      vi.stubGlobal('document', {
        createElement,
        body: { appendChild },
      });

      const receipt = computeReceipt(validateFixture(accepted));
      downloadPublicReceiptJson(receipt);

      expect(create).toHaveBeenCalledOnce();
      expect(createElement).toHaveBeenCalledWith('a');
      expect(anchor.download).toBe('motion-xray-receipt-accepted-walk.json');
      expect(anchor.href).toBe(blobUrl);
      expect(appendChild).toHaveBeenCalledWith(anchor);
      expect(click).toHaveBeenCalledOnce();
      // Neither cleanup step may run synchronously after click (review-5 zero-delay
      // still failed headed Chromium / agent-browser download).
      expect(remove).not.toHaveBeenCalled();
      expect(revoke).not.toHaveBeenCalled();

      vi.advanceTimersByTime(DOWNLOAD_CLEANUP_DELAY_MS - 1);
      expect(remove).not.toHaveBeenCalled();
      expect(revoke).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(remove).toHaveBeenCalledOnce();
      expect(revoke).toHaveBeenCalledOnce();
      expect(revoke).toHaveBeenCalledWith(blobUrl);
      expect(appendChild.mock.invocationCallOrder[0]).toBeLessThan(
        click.mock.invocationCallOrder[0]!,
      );
      expect(click.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0]!);
      expect(click.mock.invocationCallOrder[0]).toBeLessThan(revoke.mock.invocationCallOrder[0]!);
    });
  });
});

describe('production debug seam', () => {
  it('keeps the debug global behind import.meta.env.DEV in source', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/motionXrayDebug.ts'),
      'utf8',
    );
    expect(source).toContain('__MOTION_XRAY_DEBUG__');
    expect(source).toMatch(/if\s*\(\s*import\.meta\.env\.DEV\s*\)/);
  });

  it('does not ship __MOTION_XRAY_DEBUG__ in the production bundle when dist exists', () => {
    const assetsDir = join(process.cwd(), 'dist/assets');
    if (!existsSync(assetsDir)) {
      // `npm test` may run before `npm run build`; skip rather than fail the suite.
      expect(existsSync(assetsDir)).toBe(false);
      return;
    }
    const bundles = readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
    expect(bundles.length).toBeGreaterThan(0);
    for (const name of bundles) {
      const body = readFileSync(join(assetsDir, name), 'utf8');
      expect(body, name).not.toContain('__MOTION_XRAY_DEBUG__');
    }
  });
});
