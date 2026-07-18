import type { MotionFrame } from '../fixtures/schema';
import { CameraCaptureSession } from './cameraCapture';
import type { PoseEngine, PoseEngineStatus } from './poseEngine';
import { closeSharedPoseEngine, getSharedPoseEngine } from './poseEngine';
import type { MotionSource, ProbeResult } from './motionSource';

/**
 * Live camera adapter — real local MediaPipe Pose Landmarker path.
 * Frames stay in memory; no upload/storage/analytics.
 * Feature/probe checks must not open a camera stream — CameraCaptureSession owns getUserMedia.
 */
export class MediaPipeMotionSource implements MotionSource {
  private stopped = false;
  private engine: PoseEngine | null = null;
  private session: CameraCaptureSession | null = null;

  async probe(): Promise<ProbeResult> {
    // Capability check only — do not open/stop a stream before capture.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unavailable';
    }
    return 'available';
  }

  getPreviewStream(): MediaStream | null {
    return null;
  }

  async ensureEngine(
    onStatus?: (status: PoseEngineStatus) => void,
  ): Promise<PoseEngine> {
    this.engine = await getSharedPoseEngine(onStatus);
    return this.engine;
  }

  async *start(): AsyncIterable<MotionFrame> {
    this.stopped = false;
    // Prefer structured CameraCaptureSession from App; keep iterable for interface compat.
    while (!this.stopped) {
      await new Promise((resolve) => {
        globalThis.setTimeout(resolve, 250);
      });
    }
  }

  stop(): void {
    this.stopped = true;
    this.session?.cancel();
    this.session = null;
  }
}

export async function createLiveMotionSource(options?: {
  onStatus?: (status: PoseEngineStatus) => void;
}): Promise<{
  source: MediaPipeMotionSource;
  analysisReady: boolean;
  reason?: string;
  engine?: PoseEngine;
}> {
  const source = new MediaPipeMotionSource();
  const probe = await source.probe();
  if (probe === 'unavailable') {
    return {
      source,
      analysisReady: false,
      reason: 'Camera permission denied or unavailable.',
    };
  }

  try {
    const engine = await source.ensureEngine(options?.onStatus);
    return {
      source,
      analysisReady: true,
      engine,
    };
  } catch (error) {
    source.stop();
    return {
      source,
      analysisReady: false,
      reason:
        error instanceof Error
          ? error.message
          : 'Pose Landmarker model/WASM failed to load from local assets.',
    };
  }
}

export function releaseLiveRuntime(): void {
  closeSharedPoseEngine();
}

export { CameraCaptureSession };
export { FileCaptureSession, isSupportedVideoFile } from './fileCapture';
export { buildCapturedFixture, assertNoRawMedia } from './buildFixture';
export {
  poseResultToFrame,
  emptyPoseFrame,
  getSharedPoseEngine,
  closeSharedPoseEngine,
} from './poseEngine';
export {
  advanceInferenceClock,
  createInferenceClockState,
  nextInferenceTimestamp,
  InferenceClock,
} from './inferenceClock';
export type { InferenceClockState } from './inferenceClock';
