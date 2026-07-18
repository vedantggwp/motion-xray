# Motion X-Ray MVP

Browser demo that turns a short walking capture into a replayable 3D landmark visualisation and a Motion Receipt — paired left/right timing values a person can inspect and take to a professional.

**Not a verdict. A measurement you can inspect.**

This is not diagnosis, medical imaging, treatment advice, a digital twin, or a forecast of injury or degeneration.

## Product boundary

| In scope | Out of scope |
|---|---|
| Bundled deterministic synthetic fixtures (judge fallback) | Backend, auth, uploads, analytics |
| Local MediaPipe Pose Landmarker (camera + local video) | CDN/model fetches at runtime |
| Procedural landmark display rig (normalized + hip-origin world metres) | SMPL / skinned avatars / IK |
| Left/right same-side event interval receipt | Force, moment, tissue, diagnosis claims |
| Camera-plane knee flexion range estimate | Clinical ROM / normal-abnormal thresholds |
| One illustrative fork (ghost only) | Corrected / ideal / predicted gait |
| Capture-protocol abstention with reason codes | Health grading of a person's biomechanics |

## Local run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Regenerate committed fixtures (seeded typed generator):

```bash
npm run generate:fixtures
```

## Architecture

- One page, one immutable reducer (`src/app/appState.ts`), no router or state library.
- Real pose path: local WASM + `pose_landmarker_full.task` via `src/live/poseEngine.ts`.
- Camera capture (`src/live/cameraCapture.ts`) and local-video analysis (`src/live/fileCapture.ts`) call `PoseLandmarker.detectForVideo`.
- Deterministic evidence path (`src/metrics/*`) is separate from presentation choreography (`src/scene/*`).
- All displayed numbers come from a typed `MotionReceipt` via `formatReceiptDisplay`.
- All user-facing product strings live in `src/copy/copy.ts`.
- Synthetic fixtures remain the reliable offline judge fallback.

## Evidence classes

| Class | Meaning |
|---|---|
| Source data | Camera/video pixels or synthetic fixture frames — not anatomy |
| Estimated | MediaPipe landmarks (normalized image + hip-origin world metres) |
| Calculated | Deterministic TypeScript receipt fields |
| Illustrative | Dashed amber ghost fork — one stated display parameter |
| Unavailable | Forces, tissue stress, diagnosis, future outcomes |

Poor evidence abstains: timing and knee-angle fields show `not reported`, never invented certainty.

## Measurement receipt inspectability

Accepted and abstained results both expose a compact **Measurement receipt** disclosure with capture-gate evidence:

- sampled frame count, duration, pose presence, foot visibility, frame gaps, teleport frames
- candidate / accepted heel-low event estimates per side (honest estimate labels — not heel strikes)
- rejected counts by reason (`low-visibility`, `discontinuity`) and side
- interval CVs, alternation score, reason codes, source kind, fixture ID
- MediaPipe package/model identity and model SHA-256

**Download receipt JSON** exports only the deterministic receipt plus provenance metadata. It never includes raw frames, landmarks, source pixels, video name/path, blobs, or object URLs.

In development (`import.meta.env.DEV`), `window.__MOTION_XRAY_DEBUG__` holds the current fixture + receipt for diagnosing real browser clips; it is cleared on unmount and must not appear in the production bundle. A **Download fixture (dev only)** control is also DEV-gated.

Heel-low events are local maxima of the smoothed body-relative heel signal above a 60th-percentile floor (not global band-entry crossings). A real 11.85 s walk exposed under-counting under the old rule; after the evidence-backed correction, the headed browser produced 11/11 accepted events and an accepted receipt. `BROWSER_PROOF.md` preserves the positive/negative controls and exact receipt evidence.

## Tests

```bash
npm test
npm run lint:claims
npm run build
```

Covered: fixture schema, deterministic receipt equality, heel-low events, quality evidence partitions, public receipt export safety, production debug-seam DCE check, fork display, semantic mirror, abstention display gates, shuffled/constant/random/truncated adversarial gates, pose-result conversion seam, source lifecycle cleanup, knee-angle math/gating, handoff field mapping, context-aware claims lint, reducer transitions including capture phases, TypeScript + production build.

## Live analysis status

**Implemented locally in this directory.**

- Bundled assets: `/public/models/pose_landmarker_full.task` (SHA-256 `5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1`), `/public/mediapipe/wasm/` (SIMD + non-SIMD), `/public/demo/mixkit-full-body-walk.mp4` (SHA-256 `011209fbf780baa5ae05e9ea020c70bdb4de1580f04d3d6bcb4aa74da205d935`).
- Package: `@mediapipe/tasks-vision@0.10.17`.
- One-click real-video proof: same-origin fetch → browser `File` → existing local-video MediaPipe path (no precomputed landmarks/receipt).
- Camera path: protocol → 3s countdown → ~10s capture → receipt or abstention.
- Local video path: capped duration/frame count, progress, cancellation, object-URL revoke on every terminal path.
- Overlay shows source video + 2D skeleton with plain-language pose/foot feedback.
- Synthetic fixture demo remains intact offline after install as the demoted fallback.
- Verified one-click in-app Codex browser proof: the bundled Mixkit clip ran through the same-origin `File` → MediaPipe → receipt path and produced 238 sampled frames, 11/11 accepted events, perfect alternation, no gaps/teleports and grade `accepted`. The built-in poor-capture control returned `poor-foot-visibility` and `insufficient-events-per-side` while withholding timing. See `BROWSER_PROOF.md`.

## Known limitations

- No clinical validation, privacy compliance certification, or production readiness claim.
- Prototype heel-low event estimate — not a validated gait-lab heel-strike.
- Camera-plane knee angles are 2D image-space estimates, not 3D joint kinematics.
- World landmarks are MediaPipe hip-origin metres centred for display — not a personalised anatomical model.
- Single-camera monocular capture cannot establish forces, tissue stress, diagnosis, or prognosis.
- Live path still depends on browser camera/file APIs and WebAssembly; GPU init falls back to CPU.

## Judge demo flow (~90s)

1. Landing already shows a walking 3D figure. Hero: *Your body just opened a pull request.*
2. **Run real video proof** — one click fetches the bundled same-origin Mixkit walk, builds a browser `File`, and runs the real MediaPipe → receipt pipeline (video + 2D overlay during processing). Label: *Independent full-body walk · real video proof*; source remains `local-video`.
3. **Run the bundled replay** — demoted offline synthetic fallback if needed.
4. **Choose a source** — live camera, user video upload, real-video proof again, or poor-capture demo.
5. Inspect Body Diff paired timing + camera-plane knee ranges; Evidence Lens separates source / estimated / calculated / illustrative / unavailable.
6. Open **Illustrative Fork** — only the amber ghost rephases.
7. Open **Professional handoff** — questions, source values, quality, `not established`.
8. Open **Measurement receipt** — capture evidence counts + **Download receipt JSON** (accepted or abstained).
9. **View the poor-capture demo** (picker / after receipt) or feed a bad capture — analysis closes with reason codes; timing `not reported`; Measurement receipt still shows evidence.

Close line: *Codex compressed the distance from idea to testable evidence. It did not compress the standard of evidence.*

The complete one-click recording path was verified in the visible in-app Codex browser on 2026-07-18: real-video inference, 3D replay, Measurement receipt and poor-capture refusal.

## Licences / attribution

- React, Vite, Three.js, React Three Fiber, Drei — MIT.
- IBM Plex Sans / Mono — SIL OFL (via `@fontsource`, Latin subsets).
- Newsreader — SIL OFL (via `@fontsource`, Latin subsets).
- `@mediapipe/tasks-vision` and Pose Landmarker model — Apache-2.0 (Google).
- Sports2D / Pose2Sim / OpenCap — cited as prior breakthroughs; not embedded runtimes.
- Fixture data — synthetic, generated in-repo; not derived from identifiable persons.
- Demo walk clip — Mixkit Stock Video Free License; source [Young man walking listening to music from his headphones](https://mixkit.co/free-stock-video/young-man-walking-listening-to-music-from-his-headphones-4855/); local copy `public/demo/mixkit-full-body-walk.mp4` with `public/demo/ATTRIBUTION.md`. No endorsement by Mixkit or the person is claimed.
