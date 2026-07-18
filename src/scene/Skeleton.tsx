import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  Color,
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import type { MotionFrame } from '../fixtures/schema';
import {
  DISPLAY_CONNECTIONS,
  DISPLAY_JOINT_INDICES,
  HEAD_JOINT_INDEX,
  displayPoint,
} from './connections';

type Props = {
  frame: MotionFrame;
  opacity?: number;
  emphasize?: boolean;
  dimmed?: boolean;
  color?: string;
  uncertainColor?: string;
};

const UP = new Vector3(0, 1, 0);
const _start = new Vector3();
const _end = new Vector3();
const _dir = new Vector3();
const _mid = new Vector3();
const _quat = new Quaternion();
const _scale = new Vector3();
const _matrix = new Matrix4();

function segmentVisibility(
  a: { visibility: number },
  b: { visibility: number },
): number {
  return Math.min(a.visibility, b.visibility);
}

export function Skeleton({
  frame,
  opacity = 1,
  emphasize = false,
  dimmed = false,
  color = '#E9E7E1',
  uncertainColor = '#8B87A3',
}: Props) {
  const jointMesh = useRef<InstancedMesh>(null);
  const boneMesh = useRef<InstancedMesh>(null);

  const jointGeo = useMemo(() => new SphereGeometry(0.035, 12, 12), []);
  const boneGeo = useMemo(() => new CylinderGeometry(0.012, 0.012, 1, 6), []);
  const solidMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(color),
        roughness: 0.45,
        metalness: 0.1,
        transparent: true,
      }),
    [color],
  );
  const uncertainMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(uncertainColor),
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
      }),
    [uncertainColor],
  );

  useLayoutEffect(() => {
    const joints = jointMesh.current;
    const bones = boneMesh.current;
    if (!joints || !bones || frame.landmarks.length < 33) {
      return;
    }

    const baseOpacity = dimmed ? opacity * 0.35 : emphasize ? Math.min(1, opacity * 1.15) : opacity;
    solidMat.opacity = baseOpacity;
    uncertainMat.opacity = baseOpacity * 0.55;
    const hasUncertain = DISPLAY_JOINT_INDICES.some((index) => {
      const landmark = displayPoint(frame, index);
      return landmark.visibility >= 0.3 && landmark.visibility < 0.6;
    });
    joints.material = hasUncertain ? uncertainMat : solidMat;
    bones.material = hasUncertain ? uncertainMat : solidMat;

    let jointIndex = 0;
    for (const index of DISPLAY_JOINT_INDICES) {
      const landmark = displayPoint(frame, index);
      if (landmark.visibility < 0.3) {
        _matrix.compose(
          new Vector3(999, 999, 999),
          _quat.identity(),
          new Vector3(0.001, 0.001, 0.001),
        );
        joints.setMatrixAt(jointIndex, _matrix);
        jointIndex += 1;
        continue;
      }
      const visibilityScale = landmark.visibility >= 0.6 ? 1 : 0.85;
      const headScale = index === HEAD_JOINT_INDEX ? 1.55 : 1;
      const scale = visibilityScale * headScale;
      _matrix.compose(
        new Vector3(landmark.x, landmark.y, landmark.z),
        _quat.identity(),
        new Vector3(scale, scale, scale),
      );
      joints.setMatrixAt(jointIndex, _matrix);
      jointIndex += 1;
    }
    joints.count = jointIndex;
    joints.instanceMatrix.needsUpdate = true;

    let boneIndex = 0;
    for (const [a, b] of DISPLAY_CONNECTIONS) {
      const la = displayPoint(frame, a);
      const lb = displayPoint(frame, b);
      const vis = segmentVisibility(la, lb);
      if (vis < 0.3) {
        continue;
      }
      _start.set(la.x, la.y, la.z);
      _end.set(lb.x, lb.y, lb.z);
      _dir.subVectors(_end, _start);
      const length = _dir.length();
      if (length < 1e-4) {
        continue;
      }
      _mid.addVectors(_start, _end).multiplyScalar(0.5);
      _quat.setFromUnitVectors(UP, _dir.clone().normalize());
      const thickness = vis >= 0.6 ? 1 : 0.7;
      _scale.set(thickness, length, thickness);
      _matrix.compose(_mid, _quat, _scale);
      bones.setMatrixAt(boneIndex, _matrix);
      boneIndex += 1;
    }
    bones.count = boneIndex;
    bones.instanceMatrix.needsUpdate = true;
  }, [frame, opacity, emphasize, dimmed, solidMat, uncertainMat]);

  return (
    <group>
      <instancedMesh
        ref={jointMesh}
        args={[jointGeo, solidMat, DISPLAY_JOINT_INDICES.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={boneMesh}
        args={[boneGeo, solidMat, DISPLAY_CONNECTIONS.length]}
        frustumCulled={false}
      />
    </group>
  );
}
