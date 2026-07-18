import type { MotionFrame } from '../fixtures/schema';
import {
  CAMERA_COUNTDOWN_MS,
  CAMERA_FRAMING_MS,
  CAMERA_RECORD_MS,
  MIN_ANALYSIS_INTERVAL_MS,
} from './captureConstants';
import { emptyPoseFrame, type PoseEngine } from './poseEngine';

export type CameraCapturePhase =
  | 'requesting'
  | 'framing'
  | 'countdown'
  | 'capturing'
  | 'complete'
  | 'cancelled'
  | 'error';

export type CameraCaptureProgress = {
  phase: CameraCapturePhase;
  countdownRemainingMs: number;
  captureElapsedMs: number;
  frameCount: number;
  lastFrame: MotionFrame | null;
  posePresent: boolean;
  footVisibilityMean: number;
  errorMessage?: string;
};

export type CameraCaptureHandlers = {
  onProgress: (progress: CameraCaptureProgress) => void;
  videoElement: HTMLVideoElement;
};

function meanFootVisibility(frame: MotionFrame | null): number {
  if (!frame) {
    return 0;
  }
  const indices = [27, 28, 29, 30, 31, 32];
  let sum = 0;
  for (const index of indices) {
    sum += frame.landmarks[index].visibility;
  }
  return sum / indices.length;
}

function stopStream(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Camera capture: protocol framing → 3s countdown → ~10s record at bounded analysis rate.
 * Owns the only getUserMedia stream and stops every track on cancel/complete/error.
 */
export class CameraCaptureSession {
  private stream: MediaStream | null = null;
  private cancelled = false;
  private raf = 0;
  private busy = false;
  private frames: MotionFrame[] = [];
  private lastSampleAt = -Infinity;
  private captureStartedAt = 0;
  private captureError: Error | null = null;
  private readonly engine: PoseEngine;
  private readonly handlers: CameraCaptureHandlers;

  constructor(engine: PoseEngine, handlers: CameraCaptureHandlers) {
    this.engine = engine;
    this.handlers = handlers;
  }

  getFrames(): MotionFrame[] {
    return this.frames;
  }

  async start(): Promise<MotionFrame[]> {
    this.cancelled = false;
    this.captureError = null;
    this.frames = [];
    this.emit('requesting');

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Camera permission denied');
      this.emit('error', err.message);
      this.cleanup();
      throw err;
    }

    if (this.cancelled) {
      this.cleanup();
      return [];
    }

    const video = this.handlers.videoElement;
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => undefined);

    this.emit('framing');

    // Visible framing window so a solo demo can settle before countdown.
    await this.wait(CAMERA_FRAMING_MS);
    if (this.cancelled) {
      this.cleanup();
      return [];
    }

    const countdownStarted = performance.now();
    while (!this.cancelled) {
      const elapsed = performance.now() - countdownStarted;
      const remaining = Math.max(0, CAMERA_COUNTDOWN_MS - elapsed);
      this.emit('countdown', undefined, remaining);
      if (remaining <= 0) {
        break;
      }
      await this.wait(50);
    }

    if (this.cancelled) {
      this.cleanup();
      return [];
    }

    this.captureStartedAt = performance.now();
    this.lastSampleAt = -Infinity;
    await this.captureLoop();

    if (this.captureError) {
      this.cleanup();
      throw this.captureError;
    }

    if (this.cancelled) {
      this.cleanup();
      return [];
    }

    this.emit('complete');
    const result = [...this.frames];
    this.cleanup();
    return result;
  }

  cancel(): void {
    this.cancelled = true;
    this.emit('cancelled');
    this.cleanup();
  }

  private async captureLoop(): Promise<void> {
    return new Promise((resolve) => {
      const tick = () => {
        if (this.cancelled || this.captureError) {
          resolve();
          return;
        }
        const elapsed = performance.now() - this.captureStartedAt;
        if (elapsed >= CAMERA_RECORD_MS) {
          resolve();
          return;
        }

        const video = this.handlers.videoElement;
        const now = performance.now();
        if (
          !this.busy &&
          video.readyState >= 2 &&
          now - this.lastSampleAt >= MIN_ANALYSIS_INTERVAL_MS
        ) {
          this.busy = true;
          try {
            // Media/sample clock for receipts; PoseEngine maps to graph clock.
            const mediaTimestampMs = now - this.captureStartedAt;
            const detected = this.engine.detectForVideo(video, mediaTimestampMs);
            this.lastSampleAt = now;
            const recorded = detected ?? emptyPoseFrame(mediaTimestampMs);
            this.frames.push(recorded);
            // Overlay: missing detections stay null / posePresent false.
            this.emit('capturing', undefined, 0, elapsed, detected);
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Pose detection failed');
            this.captureError = err;
            this.emit('error', err.message);
            resolve();
            return;
          } finally {
            this.busy = false;
          }
        } else {
          const lastDetected = this.frames.at(-1);
          const overlayFrame =
            lastDetected &&
            lastDetected.landmarks.some((landmark) => landmark.visibility > 0)
              ? lastDetected
              : null;
          this.emit('capturing', undefined, 0, elapsed, overlayFrame);
        }

        this.raf = globalThis.requestAnimationFrame(tick);
      };
      this.raf = globalThis.requestAnimationFrame(tick);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      globalThis.setTimeout(resolve, ms);
    });
  }

  private emit(
    phase: CameraCapturePhase,
    errorMessage?: string,
    countdownRemainingMs = 0,
    captureElapsedMs = 0,
    lastFrame: MotionFrame | null = null,
  ): void {
    const posePresent = Boolean(lastFrame);
    this.handlers.onProgress({
      phase,
      countdownRemainingMs,
      captureElapsedMs,
      frameCount: this.frames.length,
      lastFrame,
      posePresent,
      footVisibilityMean: meanFootVisibility(lastFrame),
      errorMessage,
    });
  }

  private cleanup(): void {
    if (this.raf) {
      globalThis.cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    const video = this.handlers.videoElement;
    video.pause();
    video.srcObject = null;
    stopStream(this.stream);
    this.stream = null;
  }
}
