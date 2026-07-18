import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { copy } from '../copy/copy';
import { loadFixture } from '../fixtures/loader';
import type { FixtureId, MotionFixture, MotionFrame, MotionReceipt } from '../fixtures/schema';
import { FixtureSchemaError } from '../fixtures/schema';
import { CAPTURE_PROTOCOL } from '../live/captureConstants';
import {
  DEMO_VIDEO_PROOF_LABEL,
  DemoVideoProofError,
  loadDemoVideoProofFile,
} from '../live/demoVideoProof';
import type { LiveStatus, MotionSource } from '../live/motionSource';
import type { PoseEngine } from '../live/poseEngine';
import { buildForkDisplayModel } from '../metrics/fork';
import { computeReceipt, formatReceiptDisplay } from '../metrics/receipt';
import { Stage } from '../scene/Stage';
import { AbstentionPanel } from '../ui/AbstentionPanel';
import { BodyDiffCard } from '../ui/BodyDiffCard';
import { EvidenceLegend } from '../ui/EvidenceLegend';
import { EventRibbon } from '../ui/EventRibbon';
import { ForkControl } from '../ui/ForkControl';
import { HandoffDrawer } from '../ui/HandoffDrawer';
import { Hero } from '../ui/Hero';
import { MeasurementReceipt } from '../ui/MeasurementReceipt';
import { PoseOverlay } from '../ui/PoseOverlay';
import { ProvenanceStrip } from '../ui/ProvenanceStrip';
import { SourcePicker } from '../ui/SourcePicker';
import { TextSummary } from '../ui/TextSummary';
import { createInitialState, isCapturePhase, reduce } from './appState';
import {
  clearMotionXrayDebug,
  downloadDevFixtureJson,
  publishMotionXrayDebug,
} from './motionXrayDebug';
import { useReplayClock } from './useReplayClock';

const RESOLVE_MS = 900;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadBundled(id: Exclude<FixtureId, 'live-camera' | 'local-video'>): {
  fixture: MotionFixture;
  receipt: MotionReceipt;
} {
  const fixture = loadFixture(id);
  const receipt = computeReceipt(fixture);
  return { fixture, receipt };
}

export default function App() {
  const [state, dispatch] = useReducer(reduce, undefined, () =>
    createInitialState(prefersReducedMotion()),
  );
  const [fixture, setFixture] = useState<MotionFixture>(() => loadFixture('accepted-walk'));
  const [receipt, setReceipt] = useState<MotionReceipt | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ kind: 'idle' });
  const [resolveProgress, setResolveProgress] = useState(0);
  const [overlayFrame, setOverlayFrame] = useState<MotionFrame | null>(null);
  const [posePresent, setPosePresent] = useState(false);
  const [footVisibilityMean, setFootVisibilityMean] = useState(0);

  const liveSourceRef = useRef<MotionSource | null>(null);
  const engineRef = useRef<PoseEngine | null>(null);
  const cameraSessionRef = useRef<{ cancel: () => void } | null>(null);
  const fileSessionRef = useRef<{ cancel: () => void } | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const liveProbeRequestIdRef = useRef(0);
  const captureGenerationRef = useRef(0);
  const receiptRef = useRef<MotionReceipt | null>(null);

  const publishReceipt = (next: MotionReceipt | null) => {
    receiptRef.current = next;
    setReceipt(next);
  };

  const stopLiveSource = () => {
    liveSourceRef.current?.stop();
    liveSourceRef.current = null;
  };

  const cancelCaptureSessions = () => {
    cameraSessionRef.current?.cancel();
    cameraSessionRef.current = null;
    fileSessionRef.current?.cancel();
    fileSessionRef.current = null;
    stopLiveSource();
    const video = captureVideoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.removeAttribute('src');
      video.load();
    }
    setOverlayFrame(null);
  };

  const invalidateLiveProbe = () => {
    liveProbeRequestIdRef.current += 1;
    stopLiveSource();
  };

  const durationMs = fixture.frames.at(-1)?.timestampMs ?? 0;
  const playing =
    state.phase === 'hero' || state.phase === 'receipt' || state.phase === 'resolving';
  const [scrubMs, setScrubMs] = useState<number | undefined>(undefined);

  const clockMs = useReplayClock({
    durationMs,
    playing,
    reducedMotion: state.reducedMotion,
    externalMs: scrubMs,
  });

  const playheadMs = clockMs;
  const showLiveStage = isCapturePhase(state.phase);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => dispatch({ type: 'SET_REDUCED_MOTION', value: media.matches });
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCapturePhase(state.phase)) {
          captureGenerationRef.current += 1;
          cancelCaptureSessions();
        }
        dispatch({ type: 'ESCAPE' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.phase]);

  useEffect(() => {
    return () => {
      captureGenerationRef.current += 1;
      invalidateLiveProbe();
      cancelCaptureSessions();
    };
  }, []);

  useEffect(() => {
    publishMotionXrayDebug(fixture, receipt);
    return () => {
      clearMotionXrayDebug();
    };
  }, [fixture, receipt]);

  const sourcePickerOpen = state.phase === 'source-select' || state.sourcePickerOpen;

  useEffect(() => {
    if (!sourcePickerOpen) {
      invalidateLiveProbe();
      if (!isCapturePhase(state.phase)) {
        setLiveStatus({ kind: 'idle' });
      }
    }
  }, [sourcePickerOpen, state.phase]);

  useEffect(() => {
    if (state.phase !== 'resolving') {
      return;
    }

    let cancelled = false;
    const fixtureId = state.fixtureId;

    try {
      if (fixtureId === 'live-camera' || fixtureId === 'local-video') {
        // Live/local fixtures are injected before BEGIN_RESOLVE; receipt already set.
        const liveReceipt = receiptRef.current;
        if (!liveReceipt) {
          dispatch({
            type: 'FIXTURE_ERROR',
            message: copy.liveUnavailable,
          });
          return;
        }
        const delay = state.reducedMotion ? 0 : RESOLVE_MS;
        const started = performance.now();
        if (delay === 0) {
          setResolveProgress(1);
          dispatch({
            type:
              liveReceipt.quality.grade === 'accepted' ? 'RESOLVE_ACCEPTED' : 'RESOLVE_ABSTAINED',
          });
          return;
        }
        let frame = 0;
        const tick = (now: number) => {
          if (cancelled) {
            return;
          }
          const progress = Math.min(1, (now - started) / delay);
          setResolveProgress(progress);
          if (progress < 1) {
            frame = requestAnimationFrame(tick);
            return;
          }
          dispatch({
            type:
              liveReceipt.quality.grade === 'accepted' ? 'RESOLVE_ACCEPTED' : 'RESOLVE_ABSTAINED',
          });
        };
        frame = requestAnimationFrame(tick);
        return () => {
          cancelled = true;
          cancelAnimationFrame(frame);
        };
      }

      const loaded = loadBundled(fixtureId);
      if (cancelled) {
        return;
      }
      setFixture(loaded.fixture);
      publishReceipt(loaded.receipt);

      const delay = state.reducedMotion ? 0 : RESOLVE_MS;
      const started = performance.now();

      if (delay === 0) {
        setResolveProgress(1);
        dispatch({
          type: loaded.receipt.quality.grade === 'accepted' ? 'RESOLVE_ACCEPTED' : 'RESOLVE_ABSTAINED',
        });
        return;
      }

      let frame = 0;
      const tick = (now: number) => {
        if (cancelled) {
          return;
        }
        const progress = Math.min(1, (now - started) / delay);
        setResolveProgress(progress);
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
          return;
        }
        dispatch({
          type: loaded.receipt.quality.grade === 'accepted' ? 'RESOLVE_ACCEPTED' : 'RESOLVE_ABSTAINED',
        });
      };
      frame = requestAnimationFrame(tick);
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    } catch (error) {
      const message =
        error instanceof FixtureSchemaError ? error.message : copy.fixtureError;
      dispatch({ type: 'FIXTURE_ERROR', message });
    }

    return () => {
      cancelled = true;
    };
  }, [state.phase, state.fixtureId, state.reducedMotion]);

  const display = useMemo(
    () => (receipt ? formatReceiptDisplay(receipt) : null),
    [receipt],
  );

  const forkDisplayModel = useMemo(() => {
    if (!receipt || receipt.quality.grade !== 'accepted') {
      return null;
    }
    return buildForkDisplayModel(
      receipt.left.medianMs,
      receipt.right.medianMs,
      state.fork.value,
    );
  }, [receipt, state.fork.value]);

  const finishCapturedFrames = async (
    frames: MotionFrame[],
    source: 'live-camera' | 'local-video',
    generation: number,
    label?: string,
  ) => {
    if (generation !== captureGenerationRef.current) {
      return;
    }
    dispatch({
      type: 'SET_CAPTURE_PHASE',
      phase: 'processing',
      detail: copy.processingLabel,
      progress: 0.85,
    });
    setLiveStatus({ kind: 'processing', progress: 0.85, frameCount: frames.length });

    const mod = await import('../live/mediapipeAdapter');
    const captured = mod.buildCapturedFixture({ frames, source, label });
    mod.assertNoRawMedia(captured);
    const nextReceipt = computeReceipt(captured);
    mod.assertNoRawMedia(nextReceipt);

    if (generation !== captureGenerationRef.current) {
      return;
    }

    setFixture(captured);
    publishReceipt(nextReceipt);
    setOverlayFrame(null);
    cancelCaptureSessions();
    setLiveStatus({ kind: 'ready' });
    dispatch({ type: 'BEGIN_RESOLVE', fixtureId: source });
  };

  const handleLive = async () => {
    const generation = ++captureGenerationRef.current;
    cancelCaptureSessions();
    dispatch({ type: 'START_LIVE_CAPTURE' });
    setLiveStatus({ kind: 'model-loading', progress: 0.1, detail: copy.modelLoading });

    try {
      const mod = await import('../live/mediapipeAdapter');
      const result = await mod.createLiveMotionSource({
        onStatus: (status) => {
          if (generation !== captureGenerationRef.current) {
            return;
          }
          if (status.kind === 'loading') {
            setLiveStatus({
              kind: 'model-loading',
              progress: status.progress,
              detail: status.detail,
            });
            dispatch({
              type: 'SET_CAPTURE_PHASE',
              phase: 'model-loading',
              detail: status.detail,
              progress: status.progress,
            });
          }
        },
      });

      if (generation !== captureGenerationRef.current) {
        result.source.stop();
        return;
      }

      liveSourceRef.current = result.source;
      if (!result.analysisReady || !result.engine) {
        result.source.stop();
        setLiveStatus({
          kind: 'unavailable',
          reason: result.reason ?? copy.liveUnavailable,
        });
        dispatch({ type: 'FIXTURE_ERROR', message: result.reason ?? copy.liveUnavailable });
        return;
      }

      // Probe is capability-only (no stream). CameraCaptureSession owns getUserMedia.
      engineRef.current = result.engine;

      const video = captureVideoRef.current;
      if (!video) {
        dispatch({ type: 'FIXTURE_ERROR', message: 'Capture video element unavailable.' });
        return;
      }

      const session = new mod.CameraCaptureSession(result.engine, {
        videoElement: video,
        onProgress: (progress) => {
          if (generation !== captureGenerationRef.current) {
            return;
          }
          setOverlayFrame(progress.lastFrame);
          setPosePresent(progress.posePresent);
          setFootVisibilityMean(progress.footVisibilityMean);
          if (progress.phase === 'framing') {
            dispatch({
              type: 'SET_CAPTURE_PHASE',
              phase: 'framing',
              detail: CAPTURE_PROTOCOL.join(' '),
            });
            setLiveStatus({ kind: 'framing' });
          } else if (progress.phase === 'countdown') {
            dispatch({
              type: 'SET_CAPTURE_PHASE',
              phase: 'countdown',
              detail: `Countdown ${Math.ceil(progress.countdownRemainingMs / 1000)}`,
              progress: 1 - progress.countdownRemainingMs / 3000,
            });
            setLiveStatus({ kind: 'countdown', remainingMs: progress.countdownRemainingMs });
          } else if (progress.phase === 'capturing') {
            dispatch({
              type: 'SET_CAPTURE_PHASE',
              phase: 'capturing',
              detail: `Capturing ${Math.round(progress.captureElapsedMs / 1000)}s`,
              progress: progress.captureElapsedMs / 10_000,
            });
            setLiveStatus({
              kind: 'capturing',
              elapsedMs: progress.captureElapsedMs,
              frameCount: progress.frameCount,
            });
          } else if (progress.phase === 'error') {
            dispatch({
              type: 'FIXTURE_ERROR',
              message: progress.errorMessage ?? copy.liveUnavailable,
            });
          }
        },
      });
      cameraSessionRef.current = session;
      const frames = await session.start();
      cameraSessionRef.current = null;
      if (generation !== captureGenerationRef.current) {
        return;
      }
      await finishCapturedFrames(frames, 'live-camera', generation);
    } catch (error) {
      if (generation !== captureGenerationRef.current) {
        return;
      }
      cancelCaptureSessions();
      dispatch({
        type: 'FIXTURE_ERROR',
        message: error instanceof Error ? error.message : copy.liveUnavailable,
      });
      setLiveStatus({
        kind: 'unavailable',
        reason: error instanceof Error ? error.message : copy.liveUnavailable,
      });
    }
  };

  const handleFile = async (file: File, label?: string) => {
    const generation = ++captureGenerationRef.current;
    cancelCaptureSessions();
    dispatch({ type: 'START_FILE_CAPTURE' });
    setLiveStatus({ kind: 'model-loading', progress: 0.1, detail: copy.modelLoading });

    try {
      const mod = await import('../live/mediapipeAdapter');
      if (!mod.isSupportedVideoFile(file)) {
        setLiveStatus({
          kind: 'unavailable',
          reason: 'Unsupported or empty video file.',
        });
        dispatch({
          type: 'FIXTURE_ERROR',
          message: 'Unsupported or empty video file. Choose a local video/* file.',
        });
        return;
      }

      const engine = await mod.getSharedPoseEngine((status) => {
        if (generation !== captureGenerationRef.current) {
          return;
        }
        if (status.kind === 'loading') {
          setLiveStatus({
            kind: 'model-loading',
            progress: status.progress,
            detail: status.detail,
          });
          dispatch({
            type: 'SET_CAPTURE_PHASE',
            phase: 'model-loading',
            detail: status.detail,
            progress: status.progress,
          });
        }
      });
      engineRef.current = engine;

      const video = captureVideoRef.current;
      if (!video) {
        dispatch({ type: 'FIXTURE_ERROR', message: 'Capture video element unavailable.' });
        return;
      }

      const session = new mod.FileCaptureSession(engine, (progress) => {
        if (generation !== captureGenerationRef.current) {
          return;
        }
        setOverlayFrame(progress.lastFrame);
        setPosePresent(progress.posePresent);
        if (progress.lastFrame) {
          const indices = [27, 28, 29, 30, 31, 32];
          const mean =
            indices.reduce((sum, index) => sum + progress.lastFrame!.landmarks[index].visibility, 0) /
            indices.length;
          setFootVisibilityMean(mean);
        } else {
          setFootVisibilityMean(0);
        }
        if (progress.phase === 'processing' || progress.phase === 'loading') {
          dispatch({
            type: 'SET_CAPTURE_PHASE',
            phase: 'processing',
            detail: copy.processingLabel,
            progress: progress.progress,
          });
          setLiveStatus({
            kind: 'processing',
            progress: progress.progress,
            frameCount: progress.frameCount,
          });
        } else if (progress.phase === 'error') {
          dispatch({
            type: 'FIXTURE_ERROR',
            message: progress.errorMessage ?? 'Video analysis failed',
          });
        }
      });
      fileSessionRef.current = session;
      const frames = await session.analyse(file, video);
      fileSessionRef.current = null;
      if (generation !== captureGenerationRef.current) {
        return;
      }
      await finishCapturedFrames(frames, 'local-video', generation, label);
    } catch (error) {
      if (generation !== captureGenerationRef.current) {
        return;
      }
      cancelCaptureSessions();
      dispatch({
        type: 'FIXTURE_ERROR',
        message: error instanceof Error ? error.message : 'Video analysis failed',
      });
      setLiveStatus({
        kind: 'unavailable',
        reason: error instanceof Error ? error.message : 'Video analysis failed',
      });
    }
  };

  const handleRealVideoProof = async () => {
    try {
      const file = await loadDemoVideoProofFile();
      await handleFile(file, DEMO_VIDEO_PROOF_LABEL);
    } catch (error) {
      const message =
        error instanceof DemoVideoProofError || error instanceof Error
          ? error.message
          : 'Real video proof asset unavailable.';
      dispatch({ type: 'FIXTURE_ERROR', message });
      setLiveStatus({ kind: 'unavailable', reason: message });
    }
  };

  const handlePick = (source: FixtureId) => {
    captureGenerationRef.current += 1;
    cancelCaptureSessions();
    invalidateLiveProbe();
    setLiveStatus({ kind: 'idle' });
    dispatch({ type: 'PICK', source });
  };

  const handleCloseSources = () => {
    invalidateLiveProbe();
    setLiveStatus({ kind: 'idle' });
    dispatch({ type: 'ESCAPE' });
  };

  const handleCancelCapture = () => {
    captureGenerationRef.current += 1;
    cancelCaptureSessions();
    dispatch({ type: 'ESCAPE' });
    setLiveStatus({ kind: 'cancelled' });
  };

  return (
    <div className={`app phase-${state.phase}${state.reducedMotion ? ' reduced-motion' : ''}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <Hero
        onRealVideoProof={() => {
          void handleRealVideoProof();
        }}
        onStart={() => dispatch({ type: 'PRESS_START' })}
        onOpenSources={() => dispatch({ type: 'OPEN_SOURCES' })}
        disabled={isCapturePhase(state.phase)}
      />

      <TextSummary
        phase={state.phase}
        fixtureLabel={fixture.label}
        display={
          state.phase === 'hero' || isCapturePhase(state.phase) || state.phase === 'cancelled'
            ? null
            : display
        }
        captureDetail={state.captureDetail}
      />

      {state.fixtureError && (
        <p className="error-banner" role="alert">
          {state.fixtureError}
        </p>
      )}

      {state.phase === 'cancelled' && (
        <p className="error-banner" role="status">
          {copy.captureCancelled}
        </p>
      )}

      <main id="main" className="shell">
        <div className="stage-column">
          {showLiveStage ? (
            <div className="live-stage">
              <PoseOverlay
                videoRef={captureVideoRef}
                frame={overlayFrame}
                posePresent={posePresent}
                footVisibilityMean={footVisibilityMean}
              />
              <div className="capture-status" role="status" aria-live="polite">
                <p className="mono">
                  {state.phase}
                  {state.captureDetail ? ` · ${state.captureDetail}` : ''}
                  {state.captureProgress > 0
                    ? ` · ${Math.round(state.captureProgress * 100)}%`
                    : ''}
                </p>
                <button type="button" className="btn" onClick={handleCancelCapture}>
                  {copy.actions.cancelCapture}
                </button>
              </div>
            </div>
          ) : (
            <Stage
              fixture={fixture}
              receipt={receipt}
              playheadMs={playheadMs}
              forkOpen={state.fork.open}
              forkValue={state.fork.value}
              reducedMotion={state.reducedMotion}
              evidenceFocus={
                state.evidenceFocus === 'calculated' || state.evidenceFocus === 'unavailable'
                  ? null
                  : state.evidenceFocus
              }
              resolving={state.phase === 'resolving'}
              abstained={state.phase === 'abstained'}
              resolveProgress={resolveProgress}
            />
          )}
          {/* Keep a mounted video element for capture sessions even when stage swaps. */}
          {!showLiveStage && (
            <video ref={captureVideoRef} className="sr-only" muted playsInline />
          )}
          {state.phase === 'resolving' && (
            <p className="resolving-label" role="status">
              {copy.resolvingLabel}
            </p>
          )}
          {fixture.source !== 'synthetic-fixture' && state.phase === 'receipt' && (
            <p className="world-note" role="note">
              {copy.worldLandmarksNote}
            </p>
          )}
        </div>

        <aside className="evidence-rail">
          <EvidenceLegend
            focus={state.evidenceFocus}
            onFocus={(focus) => dispatch({ type: 'SET_EVIDENCE_FOCUS', focus })}
          />

          {state.phase === 'abstained' && (
            <AbstentionPanel
              reasonCodes={receipt?.quality.reasonCodes}
              onTryAccepted={() =>
                dispatch({ type: 'SWITCH_FIXTURE', fixtureId: 'accepted-walk' })
              }
            />
          )}

          {receipt && (state.phase === 'receipt' || state.phase === 'abstained') && (
            <MeasurementReceipt
              receipt={receipt}
              onDownloadDevFixture={
                import.meta.env.DEV
                  ? () => downloadDevFixtureJson(fixture)
                  : undefined
              }
            />
          )}

          {display && state.phase === 'receipt' && (
            <>
              <BodyDiffCard display={display} />
              {receipt && (
                <EventRibbon
                  receipt={receipt}
                  playheadMs={playheadMs}
                  durationMs={durationMs}
                  onScrub={(ms) => {
                    setScrubMs(ms);
                    dispatch({ type: 'SET_PLAYHEAD', ms });
                  }}
                />
              )}
              <ForkControl
                open={state.fork.open}
                value={state.fork.value}
                displayModel={forkDisplayModel}
                onToggle={(open) => dispatch({ type: 'SET_FORK_OPEN', open })}
                onChange={(value) => dispatch({ type: 'SET_FORK_VALUE', value })}
              />
              <button
                type="button"
                className="btn primary"
                onClick={() => dispatch({ type: 'OPEN_HANDOFF' })}
              >
                {copy.actions.openHandoff}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  dispatch({ type: 'SWITCH_FIXTURE', fixtureId: 'insufficient-evidence' })
                }
              >
                {copy.actions.poorCapture}
              </button>
            </>
          )}
        </aside>
      </main>

      <ProvenanceStrip
        source={fixture.source}
        fixtureId={fixture.id}
        breakthroughOpen={state.breakthroughOpen}
        onToggleBreakthrough={() => dispatch({ type: 'TOGGLE_BREAKTHROUGH' })}
      />

      <SourcePicker
        open={sourcePickerOpen}
        liveStatus={liveStatus}
        onRealVideoProof={() => {
          void handleRealVideoProof();
        }}
        onPick={handlePick}
        onLive={() => {
          void handleLive();
        }}
        onFile={(file) => {
          void handleFile(file);
        }}
        onClose={handleCloseSources}
      />

      {receipt && (
        <HandoffDrawer
          open={state.handoffOpen}
          receipt={receipt}
          onClose={() => dispatch({ type: 'CLOSE_HANDOFF' })}
        />
      )}
    </div>
  );
}
