# Body Diff: open-source motion stack decision

Date: 2026-07-18

Status: implementation decision, based on primary documentation and original repositories

## Decision

Build the judge-facing path around Google's MediaPipe Pose Landmarker for Web, fully local in the browser, and borrow capture discipline and failure handling from Sports2D. Preserve Pose2Sim, OpenCap, FreeMoCap, WHAM, and GVHMR as explicit upgrade paths rather than attempting to embed research-scale Python/GPU systems in the browser MVP.

The product claim is:

> A real browser camera or uploaded video becomes an inspectable landmark replay and camera-relative motion receipt. It is not a medical image, anatomical reconstruction, force estimate, diagnosis, or injury prediction.

## Existing work surveyed

| Project | What it already solves | Fit for this build | Decision |
|---|---|---|---|
| MediaPipe Pose Landmarker for Web | 33 body landmarks from images/video, including normalized image coordinates and hip-origin 3D world coordinates; official browser API and samples | Excellent: on-device, low latency, TypeScript/WebAssembly, no backend | Use now |
| Sports2D | Single-camera/webcam 2D kinematics, joint/segment angles, filtering, floor/camera discipline, explicit sagittal/frontal-plane limitation | Excellent conceptual and algorithmic reference; Python runtime is too heavy for the one-page browser demo | Borrow capture protocol, angle vocabulary, filtering and limits |
| Pose2Sim | Multi-camera calibration, synchronization, triangulation, filtering, OpenSim inverse kinematics; peer-reviewed validation | Strong research-grade upgrade path; not an immediate browser integration | Cite as professional/research export path |
| OpenCap | Two-or-more-smartphone 3D kinematics and dynamics validated against motion capture and force plates | Strongest validation reference; requires calibrated multi-camera/cloud workflow | Treat as future high-fidelity backend/export path |
| FreeMoCap | Maintained multi-camera open-source motion capture with calibration and 3D reconstruction | Strong local research/creator path; larger Python system and AGPL licence | Do not embed; keep as compatible export inspiration |
| WHAM / GVHMR | World-grounded monocular human motion recovery and body meshes | Visually spectacular but GPU-heavy; WHAM also requires SMPL registration/model assets | Future cinematic renderer, not MVP critical path |

## Why MediaPipe is the leverage point

MediaPipe's browser task already owns the difficult perception primitive. It returns both image landmarks and world landmarks for every frame. Codex therefore does not need to invent pose estimation. It can spend the build budget on the missing product system:

1. deterministic capture protocol;
2. local model and WASM packaging;
3. quality and coherence gates;
4. temporal filtering and event extraction;
5. inspectable 3D replay;
6. evidence classes and professional handoff;
7. adversarial tests and visible provenance.

That integration is the hackathon leverage story: Codex composes years of open-source research into a coherent, testable instrument in a single build loop.

## Frozen browser architecture

```text
camera or uploaded video
  -> MediaPipe Pose Landmarker (local WASM + local full model)
  -> normalized landmarks + hip-origin world landmarks
  -> capture protocol and temporal/coherence gates
  -> camera-plane gait event and angle estimates
  -> immutable Motion Receipt
  -> 3D Body Diff replay + provenance + abstention
```

The UI must distinguish:

- source pixels: camera/video input, kept in browser memory;
- estimated landmarks: model output;
- calculated receipt: deterministic code over landmarks;
- illustrative fork: visual parameter change only;
- unavailable: forces, tissue stress, anatomy, diagnosis and future outcomes.

## Bundled runtime assets

- `@mediapipe/tasks-vision@0.10.17`, Apache-2.0
- Google `pose_landmarker_full.task`, downloaded from the official MediaPipe model bucket
- SIMD and non-SIMD WebAssembly assets copied from the installed package

The model and WASM are served locally. The release path must not depend on a CDN, API key, backend, or user video upload to a server.

## Capture contract

- Stable camera, full body including both feet, one person only.
- Side view for the timing/knee-angle walkthrough; person moves roughly parallel to the image plane.
- Eight to twelve seconds after a short countdown.
- Live feedback for pose presence and foot visibility.
- If pose coherence, duration, visibility, periodicity or event order is insufficient, abstain and explain why.

## Heel-low event detector correction (2026-07-18)

Browser evidence from a real 11.85 s full-body profile walk (inspectability pass):

- 238 sampled frames; pose presence 0.9958; mean foot visibility 0.9374
- 0 frame gaps, 0 teleport frames
- candidates/accepted under the prior global range **entry-crossing** rule: left 6 / right 4
- no rejected candidates; only reason code `insufficient-events-per-side`
- body-relative heel series remained strongly periodic after 5 s, but later peaks sat slightly below the global high band, so most cycles stopped emitting

A read-only local-maxima experiment on the same smoothed, hip-relative signals recovered 11 left / 11 right candidates at the 60th percentile with a 500 ms same-side refractory window. That is a detector defect, not evidence the capture is bad.

**Correction shipped in this repo:** replace global low-band entry crossing with deterministic local maxima on the existing smoothed body-relative heel signal (image Y down ⇒ local max is the low-heel point), thresholded at the 60th percentile of originally-valid smoothed samples, retaining the 500 ms refractory window and existing visibility/discontinuity acceptance rules. Still labelled `heel-low event estimate`, not a heel strike.

Open-source basis (concept only — no code copied from unlicensed sources):

- MIT-licensed [`sarweshshah/gait_analysis`](https://github.com/sarweshshah/gait_analysis) gait-events: smooth heel/ankle trajectory, extrema with percentile threshold and minimum peak distance
- Public StrideIQ independently uses local maxima of heel Y plus a percentile threshold; its repo has no explicit app license, so only the concept is cited

### Post-correction browser verification

The independent 11.85 s Mixkit full-body profile clip was rerun through the actual bundled MediaPipe/WASM browser path. The result was `accepted`: 238 sampled frames, 0.9958 pose presence, 0.9374 mean foot visibility, 11 left / 11 right accepted heel-low event estimates, 0 rejected, alternation 1.0, no frame gaps or teleports, and no reason codes.

A poor/multi-person Sports2D demo clip then remained `insufficient` under `irregular-intervals`, and the Mixkit clip passed again after it in the same browser session. This is browser-path evidence for the prototype, not inherited scientific or clinical validation. Exact evidence and screenshots: `BROWSER_PROOF.md`.

## Claim ceiling

This implementation can claim that it runs real pose inference and deterministic camera-relative calculations. It cannot inherit validation from Sports2D, Pose2Sim, OpenCap, FreeMoCap, WHAM, GVHMR or MediaPipe merely by using related primitives.

## Primary sources

- MediaPipe Pose Landmarker Web guide: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- MediaPipe Web samples: https://github.com/google-ai-edge/mediapipe-samples-web
- Sports2D: https://github.com/davidpagnon/Sports2D
- Sports2D JOSS paper: https://joss.theoj.org/papers/10.21105/joss.06849
- Pose2Sim: https://github.com/perfanalytics/pose2sim
- OpenCap core: https://github.com/opencap-org/opencap-core
- OpenCap validation paper: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011462
- FreeMoCap: https://github.com/freemocap/freemocap
- WHAM: https://github.com/yohanshin/WHAM
- GVHMR: https://github.com/zju3dv/GVHMR
- gait_analysis (MIT gait-events reference): https://github.com/sarweshshah/gait_analysis
