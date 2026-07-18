import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  LineDashedMaterial,
  LineSegments,
} from 'three';
import type { Landmark } from '../fixtures/schema';
import { DISPLAY_CONNECTIONS, landmarkToWorld } from './connections';

type Props = {
  landmarks: Landmark[];
  visible: boolean;
};

/**
 * Build interleaved start/end positions for LineSegments.
 * Each DISPLAY_CONNECTIONS pair contributes exactly two vertices (six floats)
 * when both landmarks clear the visibility gate — never a continuous polyline.
 */
export function buildGhostForkPositions(landmarks: Landmark[]): Float32Array {
  const positions: number[] = [];
  if (landmarks.length < 33) {
    return new Float32Array(positions);
  }

  for (const [a, b] of DISPLAY_CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (Math.min(la.visibility, lb.visibility) < 0.3) {
      continue;
    }
    const [ax, ay, az] = landmarkToWorld(la.x, la.y, la.z);
    const [bx, by, bz] = landmarkToWorld(lb.x, lb.y, lb.z);
    positions.push(ax, ay, az, bx, by, bz);
  }

  return new Float32Array(positions);
}

/** Separate dashed amber display-connection ghost — never mutates the observed rig. */
export function GhostFork({ landmarks, visible }: Props) {
  const segmentsRef = useRef<LineSegments>(null);
  const geometry = useMemo(() => new BufferGeometry(), []);
  const material = useMemo(
    () =>
      new LineDashedMaterial({
        color: '#F2A93B',
        dashSize: 0.06,
        gapSize: 0.04,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
    [],
  );
  const segments = useMemo(
    () => new LineSegments(geometry, material),
    [geometry, material],
  );

  useLayoutEffect(() => {
    if (!visible || landmarks.length < 33) {
      return;
    }

    const positions = buildGhostForkPositions(landmarks);
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    // LineDashedMaterial requires per-vertex distances; LineSegments keeps pairs independent.
    segments.computeLineDistances();
    segmentsRef.current = segments;
  }, [geometry, landmarks, segments, visible]);

  if (!visible) {
    return null;
  }

  return (
    <group position={[0.16, 0.04, 0.12]}>
      <primitive object={segments} frustumCulled={false} />
    </group>
  );
}
