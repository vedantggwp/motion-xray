import type {
  KneeFlexionEstimate,
  KneeFlexionSide,
  Landmark,
  MotionFixture,
} from '../fixtures/schema';
import {
  LEFT_ANKLE,
  LEFT_HIP,
  LEFT_KNEE,
  RIGHT_ANKLE,
  RIGHT_HIP,
  RIGHT_KNEE,
} from '../fixtures/schema';

const VISIBILITY_GATE = 0.6;
const MIN_SAMPLES = 12;

/** Interior angle at the knee in the camera plane (degrees), from normalized landmarks. */
export function cameraPlaneKneeFlexionDeg(
  hip: Landmark,
  knee: Landmark,
  ankle: Landmark,
): number | null {
  if (
    hip.visibility < VISIBILITY_GATE ||
    knee.visibility < VISIBILITY_GATE ||
    ankle.visibility < VISIBILITY_GATE
  ) {
    return null;
  }

  const thighX = hip.x - knee.x;
  const thighY = hip.y - knee.y;
  const shankX = ankle.x - knee.x;
  const shankY = ankle.y - knee.y;

  const thighLen = Math.hypot(thighX, thighY);
  const shankLen = Math.hypot(shankX, shankY);
  if (thighLen < 1e-6 || shankLen < 1e-6) {
    return null;
  }

  const dot = (thighX * shankX + thighY * shankY) / (thighLen * shankLen);
  const clamped = Math.min(1, Math.max(-1, dot));
  // Interior joint angle; flexion range uses variation of this camera-plane angle.
  return (Math.acos(clamped) * 180) / Math.PI;
}

function aggregateSide(angles: number[]): KneeFlexionSide | null {
  if (angles.length < MIN_SAMPLES) {
    return null;
  }
  const sorted = [...angles].sort((a, b) => a - b);
  // Trim extremes for robustness (5th–95th percentile span).
  const lo = sorted[Math.floor((sorted.length - 1) * 0.05)];
  const hi = sorted[Math.floor((sorted.length - 1) * 0.95)];
  return {
    minDeg: lo,
    maxDeg: hi,
    rangeDeg: Math.max(0, hi - lo),
    sampleCount: angles.length,
  };
}

/**
 * Left/right knee flexion range in the camera plane (Sports2D-inspired).
 * Pure vector math over normalized landmarks — labelled camera-plane estimate.
 */
export function computeKneeFlexion(fixture: MotionFixture): KneeFlexionEstimate {
  const leftAngles: number[] = [];
  const rightAngles: number[] = [];

  for (const frame of fixture.frames) {
    const left = cameraPlaneKneeFlexionDeg(
      frame.landmarks[LEFT_HIP],
      frame.landmarks[LEFT_KNEE],
      frame.landmarks[LEFT_ANKLE],
    );
    const right = cameraPlaneKneeFlexionDeg(
      frame.landmarks[RIGHT_HIP],
      frame.landmarks[RIGHT_KNEE],
      frame.landmarks[RIGHT_ANKLE],
    );
    if (left !== null) {
      leftAngles.push(left);
    }
    if (right !== null) {
      rightAngles.push(right);
    }
  }

  const left = aggregateSide(leftAngles);
  const right = aggregateSide(rightAngles);

  return {
    label: 'camera-plane estimate',
    left,
    right,
    sufficient: Boolean(left && right),
  };
}

/** Mirror helper: swap sides for geometric fixtures. */
export function mirrorKneeFlexion(estimate: KneeFlexionEstimate): KneeFlexionEstimate {
  return {
    label: estimate.label,
    left: estimate.right,
    right: estimate.left,
    sufficient: estimate.sufficient,
  };
}
