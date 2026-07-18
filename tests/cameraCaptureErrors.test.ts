import { afterEach, describe, expect, it, vi } from 'vitest';
import { CameraCaptureSession } from '../src/live/cameraCapture';
import type { PoseEngine } from '../src/live/poseEngine';

function fakeVideo(): HTMLVideoElement {
  return {
    srcObject: null,
    muted: true,
    playsInline: true,
    readyState: 4,
    pause() {
      // no-op
    },
    play: async () => undefined,
  } as unknown as HTMLVideoElement;
}

describe('camera capture terminal errors', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects start() when inference throws so App cannot continue into empty-frame processing', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) =>
        globalThis.setTimeout(() => cb(performance.now()), 16) as unknown as number,
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      globalThis.clearTimeout(id);
    });

    const trackStop = vi.fn();
    const stream = {
      getTracks: () => [{ stop: trackStop }],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    });

    const engine = {
      detectForVideo: vi.fn(() => {
        throw new Error('Packet timestamp mismatch');
      }),
    } as unknown as PoseEngine;

    vi.useFakeTimers();
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());

    const session = new CameraCaptureSession(engine, {
      videoElement: fakeVideo(),
      onProgress: () => undefined,
    });

    const startPromise = session.start();
    // Attach before advancing timers so the rejection is never briefly unhandled.
    const expectation = expect(startPromise).rejects.toThrow(/Packet timestamp mismatch/);
    // Framing 2000ms + countdown 3000ms + one analysis interval sample.
    await vi.advanceTimersByTimeAsync(5200);
    await expectation;
    expect(trackStop).toHaveBeenCalled();
  });
});
