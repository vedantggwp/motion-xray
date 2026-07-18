import { Grid } from '@react-three/drei';

export function FloorPlane() {
  return (
    <group position={[0, -1.15, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#070B14" roughness={0.95} metalness={0.05} />
      </mesh>
      <Grid
        args={[12, 12]}
        cellSize={0.35}
        sectionSize={1.4}
        cellColor="#1B2334"
        sectionColor="#243049"
        fadeDistance={10}
        fadeStrength={1.4}
        infiniteGrid={false}
        position={[0, 0.001, 0]}
      />
    </group>
  );
}
