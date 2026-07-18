import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Mesh, MeshBasicMaterial, RingGeometry } from 'three';
import type { StepEvent } from '../fixtures/schema';
import type { MotionFrame } from '../fixtures/schema';
import { displayPoint } from './connections';

type Props = {
  events: StepEvent[];
  frames: MotionFrame[];
  playheadMs: number;
  reducedMotion: boolean;
};

const PULSE_MS = 300;

function frameNear(frames: MotionFrame[], timestampMs: number): MotionFrame | null {
  let best: MotionFrame | null = null;
  let bestDelta = Infinity;
  for (const frame of frames) {
    const delta = Math.abs(frame.timestampMs - timestampMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = frame;
    }
  }
  return best;
}

export function ContactPulses({ events, frames, playheadMs, reducedMotion }: Props) {
  const meshes = useRef<Array<Mesh | null>>([]);
  const accepted = useMemo(
    () => events.filter((event) => event.accepted).slice(0, 24),
    [events],
  );

  const geometry = useMemo(() => new RingGeometry(0.08, 0.14, 32), []);
  const materials = useMemo(
    () =>
      accepted.map(
        (event) =>
          new MeshBasicMaterial({
            color: new Color(event.side === 'left' ? '#4FD8EE' : '#F2A93B'),
            transparent: true,
            opacity: 0,
            depthWrite: false,
          }),
      ),
    [accepted],
  );

  useFrame(() => {
    accepted.forEach((event, index) => {
      const mesh = meshes.current[index];
      const material = materials[index];
      if (!mesh || !material) {
        return;
      }
      const age = playheadMs - event.timestampMs;
      if (age < 0 || age > PULSE_MS) {
        material.opacity = 0;
        return;
      }
      const frame = frameNear(frames, event.timestampMs);
      const heel = event.side === 'left' ? 29 : 30;
      if (!frame) {
        material.opacity = 0;
        return;
      }
      const landmark = displayPoint(frame, heel);
      mesh.position.set(landmark.x, -1.14, landmark.z);
      const t = age / PULSE_MS;
      const scale = reducedMotion ? 1.1 : 1 + t * 1.4;
      mesh.scale.set(scale, scale, scale);
      material.opacity = reducedMotion ? 0.45 : 0.7 * (1 - t);
    });
  });

  return (
    <group>
      {accepted.map((event, index) => (
        <mesh
          key={`${event.side}-${event.timestampMs}`}
          ref={(node) => {
            meshes.current[index] = node;
          }}
          geometry={geometry}
          material={materials[index]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}
