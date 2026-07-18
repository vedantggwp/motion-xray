import { useEffect, useRef } from 'react';
import type { Landmark, MotionFrame } from '../fixtures/schema';
import { DISPLAY_CONNECTIONS } from '../scene/connections';

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  frame: MotionFrame | null;
  posePresent: boolean;
  footVisibilityMean: number;
  className?: string;
};

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  landmarks: Landmark[],
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(79, 216, 238, 0.85)';
  ctx.fillStyle = 'rgba(233, 231, 225, 0.9)';

  for (const [a, b] of DISPLAY_CONNECTIONS) {
    const la = landmarks[a];
    const lb = landmarks[b];
    if (!la || !lb) {
      continue;
    }
    if (Math.min(la.visibility, lb.visibility) < 0.3) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(la.x * width, la.y * height);
    ctx.lineTo(lb.x * width, lb.y * height);
    ctx.stroke();
  }

  for (const landmark of landmarks) {
    if (landmark.visibility < 0.3) {
      continue;
    }
    ctx.beginPath();
    ctx.arc(landmark.x * width, landmark.y * height, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Source video with overlaid 2D pose — not anatomy, not an X-ray. */
export function PoseOverlay({
  videoRef,
  frame,
  posePresent,
  footVisibilityMean,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    const width = video.clientWidth || video.videoWidth || 640;
    const height = video.clientHeight || video.videoHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    if (frame?.landmarks) {
      drawSkeleton(ctx, width, height, frame.landmarks);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }, [frame, videoRef]);

  const footLabel =
    footVisibilityMean >= 0.6
      ? 'Both feet look visible enough for this capture protocol.'
      : footVisibilityMean >= 0.3
        ? 'Foot visibility is marginal — keep both feet in frame.'
        : 'Feet are not clearly visible.';

  const poseLabel = posePresent
    ? 'Pose detected in the current frame.'
    : 'No pose detected yet — stand fully in view.';

  return (
    <div className={className ?? 'pose-overlay'}>
      <div className="pose-overlay-stage">
        <video ref={videoRef} muted playsInline className="live-video" />
        <canvas ref={canvasRef} className="pose-overlay-canvas" aria-hidden="true" />
      </div>
      <p className="pose-overlay-summary" role="status" aria-live="polite">
        {poseLabel} {footLabel} Mean foot visibility {footVisibilityMean.toFixed(2)}.
      </p>
    </div>
  );
}
