import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { PerspectiveCamera } from 'three';

type Props = {
  reducedMotion: boolean;
  /** World-space vertical aim point for the figure centre. */
  lookAtY?: number;
};

export function CameraRig({ reducedMotion, lookAtY = -0.12 }: Props) {
  const { camera } = useThree();
  const baseYaw = useRef(-0.55);
  const t = useRef(0);

  useFrame((_, delta) => {
    const perspective = camera as PerspectiveCamera;
    perspective.fov = 35;
    perspective.near = 0.1;
    perspective.far = 100;
    perspective.updateProjectionMatrix();

    t.current += delta;
    const drift = reducedMotion ? 0 : (Math.sin(t.current * 0.15) * (4 * Math.PI)) / 180;
    const yaw = baseYaw.current + drift;
    // Closer orbit so the display figure fills ~65–75% of stage height.
    const radius = 3.25;
    const height = lookAtY + 0.18;
    perspective.position.set(Math.sin(yaw) * radius, height, Math.cos(yaw) * radius);
    perspective.lookAt(0, lookAtY, 0);
  });

  return null;
}
