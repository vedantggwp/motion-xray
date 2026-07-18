import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark, MotionFrame } from '../fixtures/schema';
import { LANDMARK_COUNT } from '../fixtures/schema';
import { InferenceClock } from './inferenceClock';

export type PoseEngineStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; progress: number; detail: string }
  | { kind: 'ready'; delegate: 'GPU' | 'CPU' }
  | { kind: 'error'; message: string };

/** Minimal pose-result shape for deterministic conversion tests (no webcam). */
export type PoseDetectionLike = {
  landmarks: ReadonlyArray<ReadonlyArray<Partial<Landmark> & { x: number; y: number; z: number }>>;
  worldLandmarks?: ReadonlyArray<
    ReadonlyArray<Partial<Landmark> & { x: number; y: number; z: number }>
  >;
};

export type DetectForVideoFn = (
  videoFrame: HTMLVideoElement,
  timestampMs: number,
) => PoseDetectionLike;

const MIN_POSE_DETECTION_CONFIDENCE = 0.5;
const MIN_POSE_PRESENCE_CONFIDENCE = 0.5;
const MIN_TRACKING_CONFIDENCE = 0.5;

function publicBaseUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function toLandmark(raw: Partial<Landmark> & { x: number; y: number; z: number }): Landmark {
  const visibility =
    typeof raw.visibility === 'number' && Number.isFinite(raw.visibility)
      ? Math.min(1, Math.max(0, raw.visibility))
      : 0;
  return {
    x: raw.x,
    y: raw.y,
    z: raw.z,
    visibility,
  };
}

/**
 * Deterministic test seam: convert a MediaPipe-like result into a MotionFrame.
 * Returns null when no pose is present or landmark count is wrong.
 * `timestampMs` must be the media/sample clock, not the graph inference clock.
 */
export function poseResultToFrame(
  result: PoseDetectionLike,
  timestampMs: number,
): MotionFrame | null {
  const pose = result.landmarks[0];
  if (!pose || pose.length !== LANDMARK_COUNT) {
    return null;
  }
  const landmarks = pose.map(toLandmark);
  const worldPose = result.worldLandmarks?.[0];
  const frame: MotionFrame = {
    timestampMs,
    landmarks,
  };
  if (worldPose && worldPose.length === LANDMARK_COUNT) {
    frame.worldLandmarks = worldPose.map(toLandmark);
  }
  return frame;
}

/** Schema-valid 33-landmark placeholder for scheduled samples with no pose. */
export function emptyPoseFrame(timestampMs: number): MotionFrame {
  return {
    timestampMs,
    landmarks: Array.from({ length: LANDMARK_COUNT }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0,
    })),
  };
}

async function createLandmarker(
  wasm: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  modelAssetPath: string,
  delegate: 'GPU' | 'CPU',
): Promise<PoseLandmarker> {
  return PoseLandmarker.createFromOptions(wasm, {
    baseOptions: {
      modelAssetPath,
      delegate,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    // Defaults match MediaPipe docs; documented here so capture discipline is inspectable.
    minPoseDetectionConfidence: MIN_POSE_DETECTION_CONFIDENCE,
    minPosePresenceConfidence: MIN_POSE_PRESENCE_CONFIDENCE,
    minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
    outputSegmentationMasks: false,
  });
}

/**
 * Focused local Pose Landmarker wrapper.
 * WASM and model are served from this app's public/ assets — never from a CDN.
 */
export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private status: PoseEngineStatus = { kind: 'idle' };
  private listeners = new Set<(status: PoseEngineStatus) => void>();
  private initPromise: Promise<void> | null = null;
  private closed = false;
  /** Graph clock for MediaPipe VIDEO mode — independent of media/sample time. */
  private readonly inferenceClock = new InferenceClock();

  getStatus(): PoseEngineStatus {
    return this.status;
  }

  subscribe(listener: (status: PoseEngineStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(next: PoseEngineStatus): void {
    this.status = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  async load(): Promise<void> {
    if (this.landmarker) {
      return;
    }
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.closed = false;
    this.initPromise = this.loadInternal();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async loadInternal(): Promise<void> {
    const base = publicBaseUrl();
    const wasmPath = `${base}mediapipe/wasm`;
    const modelPath = `${base}models/pose_landmarker_full.task`;

    this.setStatus({ kind: 'loading', progress: 0.15, detail: 'Resolving local WASM…' });
    const wasm = await FilesetResolver.forVisionTasks(wasmPath);
    if (this.closed) {
      return;
    }

    this.setStatus({ kind: 'loading', progress: 0.45, detail: 'Loading Pose Landmarker model…' });

    let delegate: 'GPU' | 'CPU' = 'GPU';
    try {
      this.landmarker = await createLandmarker(wasm, modelPath, 'GPU');
    } catch {
      if (this.closed) {
        return;
      }
      this.setStatus({
        kind: 'loading',
        progress: 0.7,
        detail: 'GPU init failed — falling back to CPU…',
      });
      try {
        this.landmarker = await createLandmarker(wasm, modelPath, 'CPU');
        delegate = 'CPU';
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Pose Landmarker failed to initialise';
        this.setStatus({ kind: 'error', message });
        throw error;
      }
    }

    if (this.closed) {
      this.landmarker?.close();
      this.landmarker = null;
      return;
    }

    this.setStatus({ kind: 'ready', delegate });
  }

  /**
   * Run VIDEO-mode pose detection.
   * @param mediaTimestampMs Media/sample timestamp preserved on the returned frame.
   *   The MediaPipe graph receives a strictly increasing inference timestamp.
   */
  detectForVideo(video: HTMLVideoElement, mediaTimestampMs: number): MotionFrame | null {
    if (!this.landmarker) {
      throw new Error('PoseEngine.detectForVideo called before load()');
    }
    const graphTimestampMs = this.inferenceClock.next(mediaTimestampMs);
    const result = this.landmarker.detectForVideo(video, graphTimestampMs);
    return poseResultToFrame(result, mediaTimestampMs);
  }

  /** Expose raw detect for tests that inject a stub (graph clock still advances). */
  getDetectForVideo(): DetectForVideoFn {
    if (!this.landmarker) {
      throw new Error('PoseEngine not loaded');
    }
    const landmarker = this.landmarker;
    return (video, mediaTimestampMs) => {
      const graphTimestampMs = this.inferenceClock.next(mediaTimestampMs);
      return landmarker.detectForVideo(video, graphTimestampMs);
    };
  }

  close(): void {
    this.closed = true;
    this.initPromise = null;
    this.inferenceClock.reset();
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.setStatus({ kind: 'idle' });
  }
}

let sharedEngine: PoseEngine | null = null;
let sharedLoadPromise: Promise<PoseEngine> | null = null;

/** Singleton load with duplicate-init protection across camera/file paths. */
export async function getSharedPoseEngine(
  onStatus?: (status: PoseEngineStatus) => void,
): Promise<PoseEngine> {
  if (!sharedEngine) {
    sharedEngine = new PoseEngine();
  }
  const unsubscribe = onStatus ? sharedEngine.subscribe(onStatus) : null;
  if (!sharedLoadPromise) {
    sharedLoadPromise = sharedEngine
      .load()
      .then(() => sharedEngine as PoseEngine)
      .catch((error) => {
        sharedLoadPromise = null;
        throw error;
      });
  }
  try {
    return await sharedLoadPromise;
  } finally {
    unsubscribe?.();
  }
}

export function closeSharedPoseEngine(): void {
  sharedLoadPromise = null;
  sharedEngine?.close();
  sharedEngine = null;
}
