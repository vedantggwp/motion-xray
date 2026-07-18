export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export type MotionFrame = {
  timestampMs: number;
  /** Normalized image-space landmarks (x/y in [0,1], y increases downward). */
  landmarks: Landmark[];
  /**
   * Optional MediaPipe world landmarks: hip-origin estimates in metres.
   * Labelled exactly that way in UI — not a personalised anatomical model.
   */
  worldLandmarks?: Landmark[];
};

export type MotionSourceKind = 'synthetic-fixture' | 'live-camera' | 'local-video';

export type MotionFixture = {
  id: string;
  label: string;
  source: MotionSourceKind;
  fps: number;
  frames: MotionFrame[];
};

export type FixtureId = 'accepted-walk' | 'insufficient-evidence' | 'live-camera' | 'local-video';

export type EventRejectReason = 'low-visibility' | 'discontinuity';

export type StepEvent = {
  side: 'left' | 'right';
  timestampMs: number;
  confidence: number;
  accepted: boolean;
  rejectReason?: EventRejectReason;
};

/** Per-side rejected heel-low candidate counts, partitioned by reject reason. */
export type RejectedCountsByReason = {
  left: Record<EventRejectReason, number>;
  right: Record<EventRejectReason, number>;
};

export type SideTiming = {
  intervalsMs: number[];
  medianMs: number;
  spreadMs: number;
};

/** Inspectable capture-protocol reason codes — never health grades. */
export type QualityReasonCode =
  | 'capture-too-short'
  | 'missing-pose'
  | 'poor-foot-visibility'
  | 'temporal-discontinuity'
  | 'material-frame-gaps'
  | 'insufficient-events-per-side'
  | 'irregular-intervals'
  | 'incoherent-event-sequence';

export type KneeFlexionSide = {
  rangeDeg: number;
  minDeg: number;
  maxDeg: number;
  sampleCount: number;
};

export type KneeFlexionEstimate = {
  /** Camera-plane hip–knee–ankle flexion range; not a clinical ROM claim. */
  label: 'camera-plane estimate';
  left: KneeFlexionSide | null;
  right: KneeFlexionSide | null;
  sufficient: boolean;
};

export type QualityEvidence = {
  footVisibilityMean: number;
  frameGaps: number;
  acceptedCount: number;
  rejectedCount: number;
  grade: 'accepted' | 'insufficient';
  durationMs: number;
  posePresenceRate: number;
  teleportFrameCount: number;
  intervalCvLeft: number;
  intervalCvRight: number;
  alternationScore: number;
  reasonCodes: QualityReasonCode[];
  /** Frames sampled into the fixture (capture or synthetic). */
  sampledFrameCount: number;
  /** Heel-low candidates emitted by the detector before accept/reject. */
  leftCandidateCount: number;
  rightCandidateCount: number;
  leftAcceptedCount: number;
  rightAcceptedCount: number;
  rejectedByReason: RejectedCountsByReason;
};

export type MotionReceipt = {
  fixtureId: string;
  source: MotionSourceKind;
  events: StepEvent[];
  left: SideTiming;
  right: SideTiming;
  deltaMs: number;
  deltaPct: number;
  quality: QualityEvidence;
  kneeFlexion: KneeFlexionEstimate;
  notEstablished: readonly string[];
};

export const LANDMARK_COUNT = 33;

export const LEFT_RIGHT_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 4],
  [2, 5],
  [3, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [13, 14],
  [15, 16],
  [17, 18],
  [19, 20],
  [21, 22],
  [23, 24],
  [25, 26],
  [27, 28],
  [29, 30],
  [31, 32],
] as const;

export const FOOT_LANDMARK_INDICES = [27, 28, 29, 30, 31, 32] as const;
export const LEFT_HEEL = 29;
export const RIGHT_HEEL = 30;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;

export class FixtureSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FixtureSchemaError';
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertLandmark(value: unknown, path: string): asserts value is Landmark {
  if (!value || typeof value !== 'object') {
    throw new FixtureSchemaError(`${path}: landmark must be an object`);
  }
  const landmark = value as Record<string, unknown>;
  for (const key of ['x', 'y', 'z', 'visibility'] as const) {
    if (!isFiniteNumber(landmark[key])) {
      throw new FixtureSchemaError(`${path}.${key} must be a finite number`);
    }
  }
  const visibility = landmark.visibility as number;
  if (visibility < 0 || visibility > 1) {
    throw new FixtureSchemaError(`${path}.visibility must be between 0 and 1`);
  }
}

function parseLandmarks(value: unknown, path: string): Landmark[] {
  if (!Array.isArray(value) || value.length !== LANDMARK_COUNT) {
    throw new FixtureSchemaError(`${path} must contain exactly ${LANDMARK_COUNT} landmarks`);
  }
  value.forEach((landmark, landmarkIndex) => {
    assertLandmark(landmark, `${path}[${landmarkIndex}]`);
  });
  return value as Landmark[];
}

export function validateFixture(value: unknown): MotionFixture {
  if (!value || typeof value !== 'object') {
    throw new FixtureSchemaError('Fixture must be an object');
  }
  const fixture = value as Record<string, unknown>;

  if (typeof fixture.id !== 'string' || fixture.id.length === 0) {
    throw new FixtureSchemaError('id must be a non-empty string');
  }
  if (typeof fixture.label !== 'string' || fixture.label.length === 0) {
    throw new FixtureSchemaError('label must be a non-empty string');
  }
  if (
    fixture.source !== 'synthetic-fixture' &&
    fixture.source !== 'live-camera' &&
    fixture.source !== 'local-video'
  ) {
    throw new FixtureSchemaError('source must be synthetic-fixture, live-camera, or local-video');
  }
  if (!isFiniteNumber(fixture.fps) || fixture.fps <= 0) {
    throw new FixtureSchemaError('fps must be a positive number');
  }
  if (!Array.isArray(fixture.frames) || fixture.frames.length === 0) {
    throw new FixtureSchemaError('frames must be a non-empty array');
  }

  const frames: MotionFrame[] = fixture.frames.map((frame, index) => {
    if (!frame || typeof frame !== 'object') {
      throw new FixtureSchemaError(`frames[${index}] must be an object`);
    }
    const f = frame as Record<string, unknown>;
    if (!isFiniteNumber(f.timestampMs)) {
      throw new FixtureSchemaError(`frames[${index}].timestampMs must be a finite number`);
    }
    const landmarks = parseLandmarks(f.landmarks, `frames[${index}].landmarks`);
    const parsed: MotionFrame = {
      timestampMs: f.timestampMs,
      landmarks,
    };
    if (f.worldLandmarks !== undefined) {
      parsed.worldLandmarks = parseLandmarks(
        f.worldLandmarks,
        `frames[${index}].worldLandmarks`,
      );
    }
    return parsed;
  });

  for (let i = 1; i < frames.length; i += 1) {
    if (frames[i].timestampMs < frames[i - 1].timestampMs) {
      throw new FixtureSchemaError('frames must be sorted by non-decreasing timestampMs');
    }
  }

  return {
    id: fixture.id,
    label: fixture.label,
    source: fixture.source,
    fps: fixture.fps,
    frames,
  };
}
