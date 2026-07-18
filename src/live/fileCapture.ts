import type { MotionFrame } from '../fixtures/schema';
import {
  FILE_ANALYSIS_FPS,
  FILE_MAX_DURATION_MS,
  FILE_MAX_FRAMES,
  MIN_ANALYSIS_INTERVAL_MS,
} from './captureConstants';
import { emptyPoseFrame, type PoseEngine } from './poseEngine';

export type FileCaptureProgress = {
  phase: 'loading' | 'processing' | 'complete' | 'cancelled' | 'error';
  progress: number;
  frameCount: number;
  durationMs: number;
  lastFrame: MotionFrame | null;
  posePresent: boolean;
  errorMessage?: string;
};

const VIDEO_MIME_PREFIX = 'video/';
const HAVE_METADATA = 1;
const HAVE_CURRENT_DATA = 2;

export function isSupportedVideoFile(file: File): boolean {
  if (!file || file.size <= 0) {
    return false;
  }
  if (file.type && file.type.startsWith(VIDEO_MIME_PREFIX)) {
    return true;
  }
  // Some browsers omit type; allow common extensions including .ogv.
  return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name);
}

/**
 * Deterministic local-video analysis using media timestamps.
 * Caps duration/frames; always revokes the object URL on terminal paths.
 */
export class FileCaptureSession {
  private cancelled = false;
  private objectUrl: string | null = null;
  private frames: MotionFrame[] = [];
  private readonly engine: PoseEngine;
  private readonly onProgress: (progress: FileCaptureProgress) => void;

  constructor(engine: PoseEngine, onProgress: (progress: FileCaptureProgress) => void) {
    this.engine = engine;
    this.onProgress = onProgress;
  }

  getFrames(): MotionFrame[] {
    return this.frames;
  }

  cancel(): void {
    this.cancelled = true;
    this.onProgress({
      phase: 'cancelled',
      progress: 0,
      frameCount: this.frames.length,
      durationMs: 0,
      lastFrame: null,
      posePresent: false,
    });
    this.revoke();
  }

  async analyse(file: File, videoElement: HTMLVideoElement): Promise<MotionFrame[]> {
    this.cancelled = false;
    this.frames = [];

    if (!isSupportedVideoFile(file)) {
      this.onProgress({
        phase: 'error',
        progress: 0,
        frameCount: 0,
        durationMs: 0,
        lastFrame: null,
        posePresent: false,
        errorMessage: 'Unsupported or empty video file. Choose a local video/* file.',
      });
      throw new Error('Unsupported or empty video file');
    }

    this.objectUrl = URL.createObjectURL(file);
    const video = videoElement;
    video.srcObject = null;
    video.src = this.objectUrl;
    video.muted = true;
    video.playsInline = true;

    this.onProgress({
      phase: 'loading',
      progress: 0,
      frameCount: 0,
      durationMs: 0,
      lastFrame: null,
      posePresent: false,
    });

    try {
      await waitForMetadata(video);
      if (this.cancelled) {
        this.revoke();
        return [];
      }

      // Decoded pixels required before first inference (including timestamp-zero).
      await waitForCurrentData(video, () => this.cancelled);
      if (this.cancelled) {
        this.revoke();
        return [];
      }

      const mediaDurationMs = Math.max(0, (video.duration || 0) * 1000);
      if (mediaDurationMs <= 0) {
        throw new Error('Video has no readable duration');
      }

      const analyseDurationMs = Math.min(mediaDurationMs, FILE_MAX_DURATION_MS);
      const stepMs = Math.max(MIN_ANALYSIS_INTERVAL_MS, 1000 / FILE_ANALYSIS_FPS);
      const plannedFrames = Math.min(
        FILE_MAX_FRAMES,
        Math.max(1, Math.floor(analyseDurationMs / stepMs) + 1),
      );

      for (let index = 0; index < plannedFrames; index += 1) {
        if (this.cancelled) {
          this.revoke();
          return [];
        }

        const timestampMs = Math.min(analyseDurationMs, index * stepMs);
        await seekVideo(video, timestampMs / 1000, () => this.cancelled);
        if (this.cancelled) {
          this.revoke();
          return [];
        }

        await waitForCurrentData(video, () => this.cancelled);
        if (this.cancelled) {
          this.revoke();
          return [];
        }

        // Media timestamp for receipts; PoseEngine advances the shared graph clock.
        const detected = this.engine.detectForVideo(video, timestampMs);
        const recorded = detected ?? emptyPoseFrame(timestampMs);
        this.frames.push(recorded);

        this.onProgress({
          phase: 'processing',
          progress: (index + 1) / plannedFrames,
          frameCount: this.frames.length,
          durationMs: analyseDurationMs,
          lastFrame: detected,
          posePresent: Boolean(detected),
        });
      }

      this.onProgress({
        phase: 'complete',
        progress: 1,
        frameCount: this.frames.length,
        durationMs: analyseDurationMs,
        lastFrame: this.frames.at(-1)?.landmarks.some((l) => l.visibility > 0)
          ? this.frames.at(-1)!
          : null,
        posePresent: Boolean(
          this.frames.at(-1)?.landmarks.some((landmark) => landmark.visibility > 0),
        ),
      });

      const result = [...this.frames];
      this.revoke();
      video.removeAttribute('src');
      video.load();
      return result;
    } catch (error) {
      this.onProgress({
        phase: 'error',
        progress: 0,
        frameCount: this.frames.length,
        durationMs: 0,
        lastFrame: null,
        posePresent: false,
        errorMessage: error instanceof Error ? error.message : 'Video analysis failed',
      });
      this.revoke();
      video.removeAttribute('src');
      video.load();
      throw error;
    }
  }

  private revoke(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}

function waitForMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HAVE_METADATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Video metadata failed to load'));
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
  });
}

function waitForCurrentData(
  video: HTMLVideoElement,
  isCancelled: () => boolean,
): Promise<void> {
  if (video.readyState >= HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      fn();
    };
    const onLoaded = () => finish(() => resolve());
    const onError = () =>
      finish(() => reject(new Error('Video pixels failed to decode')));
    const poll = globalThis.setInterval(() => {
      if (isCancelled()) {
        finish(() => resolve());
        return;
      }
      if (video.readyState >= HAVE_CURRENT_DATA) {
        finish(() => resolve());
      }
    }, 32);
    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('canplay', onLoaded);
      video.removeEventListener('error', onError);
      globalThis.clearInterval(poll);
    };
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('canplay', onLoaded);
    video.addEventListener('error', onError);
  });
}

function seekVideo(
  video: HTMLVideoElement,
  timeSeconds: number,
  isCancelled: () => boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      fn();
    };
    const onSeeked = () => finish(() => resolve());
    const onError = () => finish(() => reject(new Error('Video seek failed')));
    const poll = globalThis.setInterval(() => {
      if (isCancelled()) {
        finish(() => resolve());
      }
    }, 32);
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      globalThis.clearInterval(poll);
    };
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    const target = Math.min(Math.max(0, timeSeconds), Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - target) < 0.001 && video.readyState >= HAVE_CURRENT_DATA) {
      finish(() => resolve());
      return;
    }
    video.currentTime = target;
  });
}
