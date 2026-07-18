import type { MotionFixture, MotionReceipt } from '../fixtures/schema';

export type MotionXrayDebugHandle = {
  fixture: MotionFixture;
  receipt: MotionReceipt | null;
};

/**
 * Development-only seam for diagnosing real browser captures.
 * Entire bodies are gated on `import.meta.env.DEV` so production builds
 * should dead-code-eliminate the `__MOTION_XRAY_DEBUG__` string.
 */
export function publishMotionXrayDebug(
  fixture: MotionFixture,
  receipt: MotionReceipt | null,
): void {
  if (import.meta.env.DEV) {
    window.__MOTION_XRAY_DEBUG__ = { fixture, receipt };
  }
}

export function clearMotionXrayDebug(): void {
  if (import.meta.env.DEV) {
    delete window.__MOTION_XRAY_DEBUG__;
  }
}

/** Dev-only full fixture download (includes landmarks). Never call from production UI. */
export function downloadDevFixtureJson(fixture: MotionFixture): void {
  if (!import.meta.env.DEV) {
    return;
  }
  const json = JSON.stringify(fixture, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `motion-xray-fixture-dev-${fixture.id}.json`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
