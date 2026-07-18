# Motion X-Ray MVP — Fable Specification

Date: 2026-07-18

Status: Fable planning output, manager-reviewed before implementation

Source: generated from `FABLE_INPUT.md` by Fable in read-only planning mode. No code or files were edited by Fable.

## 1. Product thesis and novelty wedge

Motion X-Ray is a developer tool for the body: a browser demo that turns a short lateral walking capture into a replayable 3D landmark visualisation and a Motion Receipt — paired left/right timing values a person can inspect and take to a professional.

Hero line: `Your body just opened a pull request.`

Trust line: `Not a verdict. A measurement you can inspect.`

The wedge is not pose estimation. The wedge is the evidence contract rendered as interface. Every visible element belongs to exactly one evidence class — recorded, estimated, illustrative, or research reference — and the system's willingness to abstain is a first-class demo beat rather than an error page. Judges have seen skeletons; they are less likely to have seen a health-adjacent demo that closes an analysis instead of inventing certainty.

## 2. State model and golden path

Use a single page and one immutable reducer. Do not add a router.

```ts
type Phase = 'hero' | 'source-select' | 'resolving' | 'receipt' | 'abstained';

type AppState = {
  phase: Phase;
  fixtureId: 'accepted-walk' | 'insufficient-evidence' | 'live-camera';
  playheadMs: number;
  fork: { open: boolean; value: number };
  handoffOpen: boolean;
  reducedMotion: boolean;
};
```

Allowed transitions:

| From | Event | Result |
|---|---|---|
| `hero` | `PRESS_START` | load accepted fixture and enter `resolving` |
| `hero` | `OPEN_SOURCES` | enter `source-select` |
| `source-select` | `PICK(source)` | load source and enter `resolving` |
| `resolving` | accepted receipt | enter `receipt` |
| `resolving` | quality gate closed | enter `abstained` |
| `receipt` | scrub, fork, handoff | remain in `receipt`; change only the named overlay/value |
| `receipt` or `abstained` | switch fixture | reload and enter `resolving` |
| any | Escape | close the topmost overlay only |

Golden path:

1. Landing stage already contains a luminous 3D figure walking on loop.
2. `Run the bundled replay` triggers a deterministic reveal.
3. The source silhouette dims, the generic landmark rig resolves, trails ignite, and accepted contact pulses appear.
4. The Motion Receipt and event ribbon populate from deterministic source fields.
5. The person opens one illustrative fork. Only the dotted amber ghost changes.
6. The Professional handoff opens with questions, source values, capture quality, and the `not established` list.
7. Switching to the deliberately weak fixture dissolves uncertain foot segments and closes the analysis without showing timing values.

The receipt is computed before presentation choreography starts. Animation must never decide, delay, or mask the quality gate.

## 3. Information architecture

One page, five visible regions:

- 3D stage;
- Evidence Lens plus Body Diff card;
- event ribbon and scrubber;
- Professional handoff drawer;
- non-canvas text summary and provenance.

Responsive layout:

- At 1024px and above, use a two-column observation chamber: the stage uses the flexible left column and the evidence rail is about 380px wide.
- At 768px, the stage is about 60vh and evidence becomes a compact two-column block below.
- At 375–414px, cap the stage at 52vh, put the evidence legend directly below it, stack cards, and render the handoff as a bottom sheet.
- Never horizontally scroll. Every actionable control is at least 44 by 44 CSS pixels.

Document order is independent of the canvas: headline and action, accessible text summary, 3D stage, legend, receipt, fork, handoff, provenance.

## 4. Frozen art direction

Use a single dark observation chamber, not a dashboard.

Palette:

| Token | Value | Meaning |
|---|---|---|
| `--bg` | `#070B14` | near-black blue page and stage |
| `--figure` | `#E9E7E1` | recorded/observed rig and primary text |
| `--cyan` | `#4FD8EE` | left-side and estimated evidence accents |
| `--amber` | `#F2A93B` | right-side trace and illustrative ghost |
| `--uncertain` | `#8B87A3` | uncertain segments and secondary text |
| `--line` | `#1B2334` | floor grid and hairlines |

Type roles, installed through `@fontsource` with system fallbacks:

- Newsreader 500/600 for exactly two human-facing statements: the hero and the handoff headline.
- IBM Plex Sans for all controls and body copy.
- IBM Plex Mono for numbers, evidence labels, timestamps, and provenance only; 13px minimum.

This is intentionally not based on simplistic font psychology. Trust comes from legibility, hierarchy, consistency, navigability, contrast, and transparent provenance. The restrained serif adds a human editorial voice; sans carries interface clarity; mono makes the evidence chain inspectable.

Motion:

- interaction easing at or below 400ms;
- contact pulses 300ms;
- heel/ankle trails cover about 600ms;
- fixed three-quarter camera with no more than four degrees of slow yaw drift;
- no full orbit;
- reduced-motion mode removes drift and the staged reveal, uses short opacity changes, and renders static path traces.

## 5. The 3D scene

Use one React Three Fiber Canvas:

- `FloorPlane`: a subtle grid with accepted contact rings.
- `Skeleton`: 33 landmark spheres and a fixed connection table of procedural rods/lines. This must remain generic and non-anatomical.
- `Trails`: bounded paths for heels and ankles. Cyan for left; amber for right.
- `ContactPulses`: floor rings for accepted events only.
- `GhostFork`: a separate dotted/dashed amber skeleton, 40% opacity, mounted only when the illustrative fork is open.
- `CameraRig`: 35-degree FOV, fixed three-quarter view, optional four-degree drift.

Visibility styling:

- landmark/segment visibility at or above 0.6: solid evidence styling;
- 0.3–0.6: uncertain colour and translucency;
- below 0.3: do not render the segment.

The poor-capture sequence should reverse the spectacle: ankle and foot segments become uncertain, dissolve, the stage dims, and the abstention panel rises.

## 6. Component and module map

```text
src/
  app/          App.tsx, appState.ts, useReplayClock.ts
  copy/         copy.ts
  fixtures/     accepted-walk.json, insufficient-evidence.json, schema.ts, loader.ts
  metrics/      stepEvents.ts, timing.ts, quality.ts, receipt.ts, fork.ts
  scene/        Stage.tsx, Skeleton.tsx, Trails.tsx, ContactPulses.tsx,
                GhostFork.tsx, FloorPlane.tsx, CameraRig.tsx, connections.ts
  ui/           Hero.tsx, EvidenceLegend.tsx, BodyDiffCard.tsx, EventRibbon.tsx,
                ForkControl.tsx, HandoffDrawer.tsx, AbstentionPanel.tsx,
                TextSummary.tsx, SourcePicker.tsx, ProvenanceStrip.tsx
  live/         motionSource.ts, mediapipeAdapter.ts
scripts/        generateFixtures.ts, claimsLint.ts
tests/          receipt.test.ts, determinism.test.ts, mirror.test.ts,
                abstention.test.ts, handoffMapping.test.ts,
                claimsLint.test.ts, schema.test.ts, appState.test.ts
```

Keep modules focused and avoid a state library. One reducer plus a replay-clock hook is enough.

## 7. Fixture and receipt contracts

Generate fixtures with a seeded, committed script. Commit the generated JSON so the demo works offline after dependencies are installed.

- `accepted-walk`: 30fps, approximately 12 seconds, synthetic gait, visible feet, subtle left/right timing difference, mild seeded jitter.
- `insufficient-evidence`: matching motion but foot landmarks 27–32 have visibility between 0.15 and 0.25.

```ts
type Landmark = { x: number; y: number; z: number; visibility: number };
type MotionFrame = { timestampMs: number; landmarks: Landmark[] };
type MotionFixture = {
  id: string;
  label: string;
  source: 'synthetic-fixture' | 'live-camera';
  fps: number;
  frames: MotionFrame[];
};

type StepEvent = {
  side: 'left' | 'right';
  timestampMs: number;
  confidence: number;
  accepted: boolean;
  rejectReason?: 'low-visibility' | 'discontinuity';
};

type MotionReceipt = {
  fixtureId: string;
  source: 'synthetic-fixture' | 'live-camera';
  events: StepEvent[];
  left: { intervalsMs: number[]; medianMs: number; spreadMs: number };
  right: { intervalsMs: number[]; medianMs: number; spreadMs: number };
  deltaMs: number;
  deltaPct: number;
  quality: {
    footVisibilityMean: number;
    frameGaps: number;
    acceptedCount: number;
    rejectedCount: number;
    grade: 'accepted' | 'insufficient';
  };
  notEstablished: readonly string[];
};
```

Every displayed number must be a formatted field of `MotionReceipt`. Components must not perform new arithmetic.

## 8. Prototype metric logic

Use pure functions:

1. Candidate contact events are local heel-height minima with a 250ms refractory window.
2. Event confidence is the mean visibility of that side's heel and ankle across a five-frame window.
3. Accept an event only if confidence is at least 0.6 and the window has no frame gap above 100ms.
4. Compute same-side contact intervals, median, and interquartile range.
5. `deltaMs = right median - left median`; `deltaPct = deltaMs / mean(left median, right median) * 100`.
6. Accept the capture only when mean foot visibility is at least 0.6 and at least five events per side were accepted.
7. If the capture is insufficient, do not expose or format its timing comparison.

No universal normal/abnormal threshold exists anywhere in the application.

The illustrative fork retimes only the ghost's right-side animation phase toward the observed left median. It cannot mutate the receipt or the observed rig.

## 9. Live-camera boundary

```ts
interface MotionSource {
  probe(): Promise<'available' | 'unavailable'>;
  start(): AsyncIterable<MotionFrame>;
  stop(): void;
}
```

The live adapter may lazy-load MediaPipe only after the person chooses live camera. Permission, model, WASM, or browser failures return `unavailable` and leave the fixture demo intact. Frames remain in memory and in-browser; no uploads, storage, analytics, or backend.

Live camera is progressive enhancement. The fixture path is the release gate.

## 10. Copy deck

Hero:

`Your body just opened a pull request.`

`Motion X-Ray turns a short walking capture into a 3D landmark visualisation you can replay, inspect, and take to a professional. Not a verdict. A measurement you can inspect.`

Primary actions:

- `Run the bundled replay`
- `Use live camera (experimental)`
- `View the poor-capture demo`

Body Diff footer:

`Estimated camera-relative movement from this capture only. An observation to discuss — not an issue, condition, or risk.`

Illustrative fork:

`Illustrative variant — not a prediction. The animation changes one stated display parameter; it does not estimate pain, injury, treatment response, or your future.`

Professional handoff headline:

`Something to show, not something to conclude.`

Questions:

1. `This capture shows a repeated left/right step-timing difference. What would you look at to understand it in my context?`
2. `How repeatable, over how many captures, would a difference like this need to be before it becomes meaningful?`
3. `What history or additional observations would make this measurement more useful to you?`

Not established:

`Pain, injury, cause, tissue state, internal forces, muscle function, prognosis, or diagnosis.`

Abstention:

`Capture closed: insufficient evidence.`

`Ankle and foot landmarks fell below the visibility gate. No timing comparison is reported.`

`This is a result about the capture, not about your body. Try a side-on view with both feet fully in frame.`

## 11. Verification contract

Automated checks:

1. Identical fixture input produces a deep-equal receipt.
2. A mirror transform uses `x -> 1 - x` and swaps the named left/right landmark indices; the result swaps side labels while preserving absolute timing magnitudes within tolerance.
3. The insufficient-evidence fixture yields `grade: insufficient` and no display formatter can surface timing values.
4. Every numeric handoff token maps to a `MotionReceipt` field.
5. The claims linter rejects seeded assertive diagnostic, causal, treatment, personalised-force, and prognostic claims while allowing explicitly negated boundary copy such as `not established` and `not a prediction`.
6. Malformed fixtures fail schema validation with a visible error state.
7. Illegal reducer transitions are no-ops; fork actions can only change fork state.
8. TypeScript and production build pass.

Browser matrix:

- golden replay completes in one click;
- fork changes only the ghost and the exact parameter label;
- poor fixture visibly abstains;
- handoff source values match the Body Diff card;
- complete keyboard path with visible focus and Escape dismissal;
- reduced-motion state is honoured;
- 375, 768, 1024, and 1440px show no horizontal overflow or blocked controls.

## 12. Explicit cuts and prohibited claims

Cut from the MVP:

- SMPL/skinned avatars;
- inverse kinematics;
- force or moment models;
- backend, auth, persistence, upload, analytics;
- OpenAI API dependency;
- multi-capture history;
- PDF export;
- full camera orbit;
- more than one fork parameter.

Prohibited as personalised or affirmative claims:

- internal anatomy or medical imaging;
- tissue stress, cartilage pressure, muscle weakness/activation;
- ground-reaction force or joint moment;
- degeneration, injury probability, or future outcome;
- treatment effect or diagnosis;
- corrected, better, ideal, normal, or predicted movement;
- 3D scan, X-ray result, digital twin, or biomechanical reconstruction;
- universal thresholds;
- `failed` as the abstention state.

## 13. Recommended implementation sequence

1. Scaffold React/TypeScript, fonts, tokens, centralized copy, and the context-aware claims linter.
2. Implement seeded fixture generation, committed fixtures, schema validation, and tests.
3. Implement the deterministic metric pipeline and receipt integrity tests.
4. Implement the reducer and transition tests.
5. Build the 3D scene: skeleton, floor/camera, trails, pulses, ghost.
6. Build the interface shell: hero, Evidence Lens, Body Diff card, ribbon, fork, abstention, handoff, provenance.
7. Complete reduced-motion, keyboard, screen-reader summary, and 375px passes.
8. Add the live adapter only behind the intact fixture path.
9. Run automated and browser verification, then retain screenshots and a build receipt.

The fixture path, steps 1–7, is the golden release path. Live camera is time-boxed and cannot block the demo.

## 14. Sixty-second judge script

- 0–8 seconds: the figure is already walking. `Your body just opened a pull request. Everything here belongs to one evidence class.`
- 8–20 seconds: run the replay. `Estimated camera-relative movement — a landmark visualisation, not a scan.`
- 20–32 seconds: show the paired receipt. `Not a verdict. A measurement you can inspect.`
- 32–44 seconds: move the fork. `One stated display parameter. Not a correction and not a prediction. No auto-merge into diagnosis.`
- 44–54 seconds: show the professional handoff and `not established` list.
- 54–60 seconds: load the weak fixture. Feet dissolve and the receipt closes. `When the evidence is not there, it says so.`

Close:

`Codex compressed the distance from idea to testable evidence. It did not compress the standard of evidence.`

## 15. Frozen decisions

- Vite, React, TypeScript, React Three Fiber, and minimal Drei primitives.
- One page and one reducer; no router or store.
- Fixture-first, offline golden path; live camera is progressive enhancement.
- One retiming fork parameter.
- Palette, type roles, and responsive constraints above are fixed.
- Fixed three-quarter camera with minimal drift, disabled by reduced motion.
- Every displayed number comes from the receipt.
- All user-facing copy is centralized.
- Claims linting is context-aware and tested with both blocked and allowed examples.
- Scientific and claim boundaries are non-negotiable.
- When spectacle and evidence conflict, change the presentation, never the claim.

## Manager adjudication of Fable output

The following corrections are incorporated above and override the literal first-pass Fable wording:

1. A mirror test must swap semantic left/right landmark identities as well as transform coordinates.
2. The claims linter must distinguish prohibited assertions from explicit boundary statements; it cannot reject words merely because they appear in the `not established` list.
3. An insufficient capture may calculate internal debugging intermediates, but it must never format or display timing. Public copy says `not reported`, not `not computed`.
4. The user-selected implementation model is Cursor Grok 4.5 High Fast, not GPT-5.6. GPT-5.6 remains part of the research story, not the implementation receipt for this pass.
5. Because fixture Y is normalized image-space and increases downward, the implemented event proxy uses local maxima of the smoothed body-relative heel signal above a deterministic 60th-percentile floor, with a same-side refractory window. It is labelled a `heel-low event estimate`, not a measured heel strike or ground contact.
