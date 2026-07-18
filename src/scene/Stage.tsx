import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import type { MotionFixture, MotionReceipt } from '../fixtures/schema';
import { ghostPlayheadMs } from '../metrics/fork';
import { CameraRig } from './CameraRig';
import { ContactPulses } from './ContactPulses';
import { estimateBodyCentreY } from './connections';
import { FloorPlane } from './FloorPlane';
import { GhostFork } from './GhostFork';
import { Skeleton } from './Skeleton';
import { Trails } from './Trails';

type EvidenceFocus = 'recorded' | 'estimated' | 'illustrative' | 'research' | null;

type Props = {
  fixture: MotionFixture;
  receipt: MotionReceipt | null;
  playheadMs: number;
  forkOpen: boolean;
  forkValue: number;
  reducedMotion: boolean;
  evidenceFocus: EvidenceFocus;
  resolving: boolean;
  abstained: boolean;
  resolveProgress: number;
};

function frameAt(fixture: MotionFixture, ms: number) {
  const frames = fixture.frames;
  if (frames.length === 0) {
    return null;
  }
  let best = frames[0];
  let bestDelta = Math.abs(best.timestampMs - ms);
  for (let i = 1; i < frames.length; i += 1) {
    const delta = Math.abs(frames[i].timestampMs - ms);
    if (delta < bestDelta) {
      best = frames[i];
      bestDelta = delta;
    }
  }
  return best;
}

function StageContent({
  fixture,
  receipt,
  playheadMs,
  forkOpen,
  forkValue,
  reducedMotion,
  evidenceFocus,
  resolving,
  abstained,
  resolveProgress,
}: Props) {
  const frame = useMemo(() => frameAt(fixture, playheadMs), [fixture, playheadMs]);
  const ghostMs =
    receipt && forkOpen
      ? ghostPlayheadMs(
          playheadMs,
          receipt.left.medianMs,
          receipt.right.medianMs,
          forkValue,
        )
      : playheadMs;
  const ghostFrame = useMemo(() => frameAt(fixture, ghostMs), [fixture, ghostMs]);

  if (!frame) {
    return null;
  }

  const lookAtY = estimateBodyCentreY(frame);

  const estimatedEmphasized = evidenceFocus === 'estimated' || evidenceFocus === null;
  const dimEstimated =
    evidenceFocus !== null &&
    evidenceFocus !== 'estimated' &&
    evidenceFocus !== 'illustrative';
  const dimTrails =
    evidenceFocus !== null &&
    evidenceFocus !== 'estimated' &&
    evidenceFocus !== 'recorded';

  const opacity = abstained
    ? 0.25
    : resolving
      ? 0.35 + resolveProgress * 0.65
      : 1;

  return (
    <>
      <color attach="background" args={['#070B14']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <directionalLight position={[-2, 2, -3]} intensity={0.35} color="#4FD8EE" />
      <CameraRig reducedMotion={reducedMotion} lookAtY={lookAtY} />
      <FloorPlane />
      <Skeleton
        frame={frame}
        opacity={opacity}
        emphasize={estimatedEmphasized && !dimEstimated}
        dimmed={dimEstimated}
      />
      {!abstained && (
        <>
          <Trails
            frames={fixture.frames}
            playheadMs={playheadMs}
            side="left"
            reducedMotion={reducedMotion}
            emphasize={evidenceFocus === 'estimated' || evidenceFocus === 'recorded'}
            dimmed={dimTrails}
          />
          <Trails
            frames={fixture.frames}
            playheadMs={playheadMs}
            side="right"
            reducedMotion={reducedMotion}
            emphasize={evidenceFocus === 'estimated' || evidenceFocus === 'recorded'}
            dimmed={dimTrails}
          />
        </>
      )}
      {receipt && !abstained && (
        <ContactPulses
          events={receipt.events}
          frames={fixture.frames}
          playheadMs={playheadMs}
          reducedMotion={reducedMotion}
        />
      )}
      {ghostFrame && forkOpen && !abstained && (
        <GhostFork landmarks={ghostFrame.landmarks} visible />
      )}
    </>
  );
}

export function Stage(props: Props) {
  return (
    <div className="stage" role="img" aria-label="3D landmark visualisation stage">
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
        <Suspense fallback={null}>
          <StageContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
