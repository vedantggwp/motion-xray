import { describe, expect, it, vi } from 'vitest';
import { FileCaptureSession, isSupportedVideoFile } from '../src/live/fileCapture';
import type { PoseEngine } from '../src/live/poseEngine';
import { MediaPipeMotionSource } from '../src/live/mediapipeAdapter';

function fakeVideo(durationSeconds = 12): HTMLVideoElement {
  const listeners = new Map<string, Set<() => void>>();
  let currentTime = 0;
  const video = {
    src: '',
    srcObject: null as MediaStream | null,
    muted: true,
    playsInline: true,
    duration: durationSeconds,
    readyState: 4,
    get currentTime() {
      return currentTime;
    },
    set currentTime(value: number) {
      currentTime = value;
      queueMicrotask(() => {
        for (const handler of listeners.get('seeked') ?? []) {
          handler();
        }
      });
    },
    addEventListener(type: string, handler: () => void) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)!.add(handler);
    },
    removeEventListener(type: string, handler: () => void) {
      listeners.get(type)?.delete(handler);
    },
    removeAttribute() {
      this.src = '';
    },
    load() {
      // no-op
    },
  };
  return video as unknown as HTMLVideoElement;
}

describe('source lifecycle helpers', () => {
  it('rejects unsupported or empty files visibly', () => {
    expect(isSupportedVideoFile(new File([], 'empty.mp4', { type: 'video/mp4' }))).toBe(false);
    expect(
      isSupportedVideoFile(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    ).toBe(false);
    expect(
      isSupportedVideoFile(new File(['bytes'], 'walk.webm', { type: 'video/webm' })),
    ).toBe(true);
    expect(isSupportedVideoFile(new File(['bytes'], 'walk.ogv'))).toBe(true);
  });

  it('revokes object URLs when cancelled before analysis completes', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-video');

    const engine = {
      detectForVideo: vi.fn(() => null),
    } as unknown as PoseEngine;

    const session = new FileCaptureSession(engine, () => undefined);
    const video = fakeVideo();

    const analysePromise = session.analyse(
      new File(['abc'], 'clip.mp4', { type: 'video/mp4' }),
      video,
    );
    session.cancel();
    const frames = await analysePromise;
    expect(frames).toEqual([]);
    expect(create).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:test-video');

    revoke.mockRestore();
    create.mockRestore();
  });

  it('probe does not open a getUserMedia stream', async () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });

    const source = new MediaPipeMotionSource();
    await expect(source.probe()).resolves.toBe('available');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('keeps missing detections in the frame list while overlay lastFrame stays null', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-video');

    const engine = {
      detectForVideo: vi.fn(() => null),
    } as unknown as PoseEngine;

    const progressEvents: Array<{ lastFrame: unknown; posePresent: boolean; frameCount: number }> =
      [];
    const session = new FileCaptureSession(engine, (progress) => {
      if (progress.phase === 'processing') {
        progressEvents.push({
          lastFrame: progress.lastFrame,
          posePresent: progress.posePresent,
          frameCount: progress.frameCount,
        });
      }
    });

    const frames = await session.analyse(
      new File(['abc'], 'clip.mp4', { type: 'video/mp4' }),
      fakeVideo(0.2),
    );

    expect(frames.length).toBeGreaterThan(0);
    expect(frames.every((frame) => frame.landmarks.every((l) => l.visibility === 0))).toBe(true);
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents.every((event) => event.lastFrame === null)).toBe(true);
    expect(progressEvents.every((event) => event.posePresent === false)).toBe(true);

    revoke.mockRestore();
    create.mockRestore();
  });
});
