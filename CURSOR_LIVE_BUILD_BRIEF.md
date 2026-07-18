# Cursor Grok 4.5 implementation brief: make Body Diff real
You are the implementation engineer. The product owner explicitly selected **Cursor Grok 4.5 High Fast**. Work only inside this directory.

## Objective

Replace the synthetic-only live-camera stub with a genuine, fully local MediaPipe browser pipeline. A user must be able to:

1. open the source picker;
2. choose a camera or local video file;
3. see the actual model load from bundled assets;
4. capture/analyse real frames locally;
5. see the detected pose overlaid on the source preview;
6. receive either a real landmark replay and deterministic Motion Receipt or a specific abstention;
7. inspect whether each visible element is source, model-estimated, calculated, illustrative, or unavailable.

The bundled synthetic fixture remains as a reliable judge fallback. Do not remove it.

## Read first

- `RESEARCH_OPEN_SOURCE_STACK.md`
- `FABLE_SPEC.md`
- `README.md`
- `BUILD_RECEIPT.md`
- all current `src/live`, `src/metrics`, `src/app`, `src/ui`, and `src/scene` modules
- all current tests

## Runtime already supplied

- `@mediapipe/tasks-vision@0.10.17` is in `package.json`.
- `/public/models/pose_landmarker_full.task` is the official full float16 task model.
- `/public/mediapipe/wasm/` contains SIMD and non-SIMD assets copied from the installed package.

Never fetch a model, WASM file or script from a CDN at runtime.

## Required architecture

### 1. Real pose engine

Create a focused pose-engine module wrapping `FilesetResolver` and `PoseLandmarker`.

- resolve WASM from `${baseUrl}mediapipe/wasm`;
- load `${baseUrl}models/pose_landmarker_full.task`;
- `runningMode: 'VIDEO'`, `numPoses: 1`;
- use sensible detection/presence/tracking confidence values, documented in code;
- try GPU delegation, then fall back to CPU if initialization fails;
- expose load progress/status, `detectForVideo`, and `close`;
- prevent duplicate concurrent initialisation;
- never retain video pixels or frames after the user closes/restarts.

### 2. Camera and upload sources

Support both:

- camera capture with `getUserMedia`;
- local `video/*` file analysis using an object URL that is always revoked.

For camera:

- show a short capture protocol: stable side view, one person, full body and both feet visible;
- show a 3-second countdown and record roughly 10 seconds;
- sample detections at a bounded rate suitable for the UI (target 15-30 analysed frames/second; do not queue work);
- stop every track on cancel, completion, error, source switch, picker close and unmount.

For file:

- reject unsupported or empty files visibly;
- seek/process frames deterministically using media timestamps;
- cap duration and frame count so a huge video cannot freeze the page;
- show progress and allow cancellation;
- revoke object URLs on every terminal path.

### 3. Live evidence overlay

Render the source `<video>` with an overlaid 2D skeleton/canvas while analysing. Show pose presence and foot visibility as plain-language capture feedback. Do not call the overlay anatomy or an X-ray.

### 4. Motion data contract

Extend `MotionFrame` to carry optional `worldLandmarks` while preserving normalized `landmarks` for image-space metrics. MediaPipe world landmarks are hip-origin estimates in metres; label them exactly that way. Ensure fixture validation remains compatible with existing JSON.

Create a `MotionFixture` with:

- unique local id;
- source `live-camera` or a new explicit `local-video` source;
- captured media timestamps rebased to zero;
- normalized and world landmarks;
- no raw pixels or video blob embedded in the fixture.

The 3D renderer should prefer world landmarks when present, centring/scaling them for display without pretending they form a personalised anatomical model.

### 5. Stronger capture quality and adversarial rejection

The current quality gate incorrectly accepts temporally shuffled valid frames. Fix that. Add inspectable quality fields and reason codes for at least:

- capture too short;
- missing/low-confidence pose;
- poor foot visibility;
- temporal discontinuity/teleporting landmarks;
- insufficient repeated events per side;
- implausibly irregular same-side intervals;
- event sequence not sufficiently alternating/coherent.

Use capture-protocol plausibility gates, not universal normal/abnormal health thresholds. Never grade a person's biomechanics as good/bad.

The exact previously failing counterexample must become a regression test: deterministically shuffle the committed accepted fixture's frames while keeping timestamps ordered; the result must abstain and timing must be `not reported`.

Also add tests for constant pose, random high-visibility landmarks and truncated capture; all must abstain.

### 6. Camera-plane kinematics

Add one visually useful, deterministic measurement inspired by Sports2D: left/right knee flexion range in the camera plane using hip-knee-ankle angles. Requirements:

- pure vector math over normalized landmarks;
- visibility-gated and robustly aggregated;
- clearly labelled `camera-plane estimate`;
- no normal/abnormal threshold;
- hidden on abstention;
- every displayed number comes from the receipt/view model, never component arithmetic;
- tests cover a known geometric fixture, mirror behavior and insufficient evidence.

Do not add forces, joint moments, centre-of-mass claims, tissue stress, degeneration, diagnosis or injury prediction.

### 7. UI state and accessibility

Extend the existing reducer rather than introducing a state library. Include explicit states for model loading, framing, countdown, capturing, processing, receipt, cancelled and abstained. Escape closes only the topmost surface and must perform cleanup.

The source dialog must remain keyboard reachable. Status/progress updates need appropriate live regions. Canvas/video evidence must have an equivalent text summary. Honour reduced motion.

### 8. Provenance and wow

For real analysis, the provenance strip must show:

`local video pixels -> MediaPipe Pose Landmarker -> deterministic TypeScript receipt -> 3D evidence replay`

Add a compact `Built from existing breakthroughs` disclosure linking MediaPipe, Sports2D, Pose2Sim and OpenCap. The story is composition, not invention or inherited validation.

The judge beat should be visible: live pixels on the left resolve into the luminous 3D replay on completion. Keep the existing cinematic art direction.

## Test and proof requirements

Run and make green:

```text
npm test
npm run lint:claims
npm run build
```

Add a deterministic test seam so pose result conversion can be tested without a webcam. Do not mock away cleanup behavior. Add tests for:

- model result -> frame conversion;
- source lifecycle and cancellation where practical;
- shuffled-frame, constant-pose, random and truncated abstention;
- live receipt never containing raw pixels;
- new knee-angle calculation and display gating;
- existing fixture, mirror, handoff, reducer and claim-lint behavior.

## Definition of done

- The old `analysisReady: false` stub is gone.
- Model and WASM load locally with networking disabled after page load.
- Camera and local video paths invoke actual `PoseLandmarker.detectForVideo`.
- A completed real capture becomes the fixture used by the existing 3D stage and receipt.
- Bad captures visibly abstain with reason codes.
- The shuffled-frame attack no longer produces a receipt.
- Existing deterministic fixture demo still works.
- Tests, claim lint and production build pass.
- `README.md`, `BUILD_RECEIPT.md` and licence/attribution notes are updated honestly.

Do not claim clinical validation or diagnose anything. Do not leave TODO-only shells. Do not edit outside this directory.
