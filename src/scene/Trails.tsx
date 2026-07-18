import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
} from 'three';
import type { MotionFrame } from '../fixtures/schema';
import { displayPoint } from './connections';

type Props = {
  frames: MotionFrame[];
  playheadMs: number;
  side: 'left' | 'right';
  reducedMotion: boolean;
  emphasize?: boolean;
  dimmed?: boolean;
};

const TRAIL_MS = 600;
const LEFT_HEEL = 29;
const RIGHT_HEEL = 30;

export function Trails({
  frames,
  playheadMs,
  side,
  reducedMotion,
  emphasize = false,
  dimmed = false,
}: Props) {
  const color = side === 'left' ? '#4FD8EE' : '#F2A93B';
  const heelIndex = side === 'left' ? LEFT_HEEL : RIGHT_HEEL;
  const playheadRef = useRef(playheadMs);
  playheadRef.current = playheadMs;

  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    const positions = new Float32Array(180 * 3);
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setDrawRange(0, 0);
    const material = new LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });
    return new Line(geometry, material);
  }, [color]);

  useFrame(() => {
    const geometry = line.geometry;
    const material = line.material as LineBasicMaterial;
    const attr = geometry.getAttribute('position') as Float32BufferAttribute;
    const ms = playheadRef.current;
    const windowStart = reducedMotion ? 0 : Math.max(0, ms - TRAIL_MS);
    const points: number[] = [];

    for (const frame of frames) {
      if (frame.timestampMs < windowStart || frame.timestampMs > ms) {
        continue;
      }
      const landmark = displayPoint(frame, heelIndex);
      if (landmark.visibility < 0.3) {
        continue;
      }
      points.push(landmark.x, landmark.y, landmark.z);
    }

    const max = Math.min(points.length / 3, attr.count);
    for (let i = 0; i < max; i += 1) {
      attr.setXYZ(i, points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
    }
    attr.needsUpdate = true;
    geometry.setDrawRange(0, max);
    material.opacity = dimmed ? 0.2 : emphasize ? 1 : 0.8;
  });

  return <primitive object={line} />;
}
