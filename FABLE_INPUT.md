# Fable product-spec brief: Motion X-Ray

Date: 2026-07-18

Purpose: planning input only. Produce a buildable, end-to-end MVP specification. Do not edit files or implement code.

## Product intent

Build a memorable browser demo that turns a short lateral walking capture into an inspectable 3D landmark visualisation and a clinician-conversation receipt. The experience should feel like a developer tool for the body: the person can replay what was estimated, compare left/right timing and repeatability, and create an explicitly illustrative motion fork by changing one visible parameter.

This is not diagnosis, medical imaging, treatment advice, a digital twin, or a forecast of injury or degeneration. The promise is: help a person notice and communicate a repeatable movement observation so a qualified professional can investigate it with better context.

Working names and lines:

- Product: `Motion X-Ray`
- Feature language: `Body Diff`, `Motion Receipt`, `Illustrative Fork`
- Hero line candidate: `Your body just opened a pull request.`
- Trust line: `Not a verdict. A measurement you can inspect.`
- Safety line: `No auto-merge into diagnosis.`

## Judge-visible wow moment

In under 45 seconds:

1. Open a dark, cinematic page with a moving luminous 3D skeleton already alive in the hero.
2. Start the bundled replay (the reliable demo path) or choose live camera.
3. The source silhouette dims and the estimated joint-and-bone figure resolves in 3D.
4. Cyan and amber heel/ankle trails reveal left/right timing; accepted contact events pulse on a floor plane.
5. A compact `Body Diff` card shows paired timing and repeatability values with confidence and provenance.
6. Drag one `Illustrative Fork` control. A dotted translucent ghost separates from the observed figure while the exact transformation and `not a prediction` label remain visible.
7. Open the `Professional handoff` card: three neutral questions, the source values, capture quality, and the explicit `not established` list.
8. Switch to a deliberately poor fixture: uncertain limb segments dissolve and the system closes the analysis instead of inventing certainty.

## Scientific/evidence contract

Use four visual evidence classes consistently:

- Recorded pixels: source video/silhouette; directly visible but not anatomy.
- Estimated: generic 2D/3D landmark representation from a model; solid/off-white or translucent cyan depending on confidence.
- Illustrative scenario: a parameterised animation fork; dotted amber; never called corrected, better, ideal, normal, prediction, or outcome.
- Research reference: detached, dashed and cited population-level context; never mapped onto the person as a personalised force, tissue, or prognosis claim.

Never show or claim personalised internal bones from imaging, tissue stress, cartilage pressure, muscle weakness/activation, ground-reaction forces, joint moments, degeneration, injury probability, a ten-year future, treatment effect, or diagnosis.

Required persistent copy near the 3D fork:

`Illustrative variant — not a prediction. The animation changes one stated display parameter; it does not estimate pain, injury, treatment response, or your future.`

Required product wording:

- `3D landmark visualisation`, not 3D scan, X-ray result, biomechanical reconstruction, or digital twin.
- `Estimated camera-relative movement`, not anatomical measurement.
- `Observation to discuss`, not issue, condition, or risk.
- `Capture closed: insufficient evidence`, not failed or normal.

## One-day implementation boundary

The golden path must work with no camera, API key, or network after install by using bundled deterministic fixtures. Live camera is progressive enhancement.

Recommended stack:

- Vite, React, TypeScript.
- Three.js via React Three Fiber if it materially accelerates a polished, accessible implementation; otherwise direct Three.js.
- Procedural skeleton from 33 MediaPipe-compatible landmarks: joints as spheres, bones as cylinders/lines, trails as bounded buffers.
- Optional `@mediapipe/tasks-vision` live-camera adapter, isolated behind an interface and allowed to report unavailable without breaking the demo.
- No SMPL, skinned avatar, downloaded humanoid, inverse kinematics, force model, backend, auth, database, or OpenAI API dependency in this MVP.
- Deterministic fixture JSON is the source of truth for the demo, metrics, tests, and professional handoff.
- All capture processing stays in the browser. No uploads and no analytics.

## Fixture and metric contract

Bundle at least:

1. `accepted-walk`: a synthetic or consent-safe MediaPipe-compatible landmark sequence with visible feet, a subtle left/right timing difference, and high confidence.
2. `insufficient-evidence`: the same style of motion with feet/ankles hidden or visibility below the gate so the analysis abstains.

Minimum normalized frame shape:

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
```

The demo may use a precomputed metric receipt, but it must remain traceable to fixture fields and deterministic. Suggested display values:

- left median step interval;
- right median step interval;
- paired timing delta in milliseconds and percentage;
- trial-to-trial repeatability/spread;
- capture quality and accepted/rejected event count.

Do not apply universal normal/abnormal thresholds. Describe only what the bundled recording shows.

## Required routes/states

A single-page experience is preferred, but it must clearly support:

- default cinematic landing state with 3D motion already visible;
- guided replay/capture state;
- evidence replay with timeline and evidence legend;
- illustrative fork controls;
- professional handoff drawer/modal/card;
- insufficient-evidence abstention state;
- reduced-motion state and a non-canvas text summary.

## Design direction

The design must combine wonder with restraint. Avoid generic AI gradients, hospital-blue sterility, injury-red heatmaps, glassmorphism everywhere, sci-fi HUD clutter, or a dashboard wall of cards.

Provisional art direction:

- Near-black blue background with off-white observed figure.
- Cyan for left/recorded evidence, warm amber for right/illustrative fork, muted violet-grey for uncertainty.
- A single large 3D stage is the focal object. Supporting evidence is compact and editorial.
- Cinematic reveal, short trails, contact pulses, subtle spatial orbit; no full dramatic spin that implies accurate depth.
- Motion respects `prefers-reduced-motion` and never hides information.
- Mobile-first: 375px must remain usable; controls at least 44px; no horizontal scrolling; canvas height capped so essential evidence remains reachable.

Typography must be research-grounded rather than based on font folklore:

- The evidence supports clarity, navigability, aesthetic coherence, familiarity, and professional execution as trust signals in health-information interfaces.
- Serif versus sans-serif alone does not reliably determine objective legibility; context, size, spacing, contrast, and implementation matter.
- Serif and sans-serif can both carry trust better than script or decorative faces; use personality associations cautiously and keep body/data text highly legible.
- Proposed family system to adjudicate: a restrained editorial serif such as Newsreader for one or two large human-facing statements; IBM Plex Sans for interface/body; IBM Plex Mono only for provenance, timing, and evidence labels. Use at most these three roles, self-hosted or packaged, with robust fallbacks.

Three interface explorations were commissioned before freezing the design:

1. **Cinematic observation chamber.** One near-black full-viewport stage, one morphing action, the figure always dominant, an evidence-key overlay, a lower event ribbon that becomes the receipt, and a final provenance graph. It recommends the label `BODY DIFF · Motion X-Ray view`, restrained cyan/amber evidence colour, and a visible locked layer for claims the camera cannot support. Strength: spectacular and coherent. Risk: evidence and controls can become too hidden.
2. **Playful evidence theatre.** A warm, memorable `your body opened a pull request` prologue, a narrow PR rail, central Evidence Lens with four stops (`visible`, `estimated`, `illustrative`, `unavailable`), a deterministic review gauntlet, and a receipt-press ending. Strength: the safety boundary becomes an interaction and the Codex story is legible. Risk: too much ceremony and UI for a one-pass demo.
3. **Scientific instrument.** Treat the page like a modern measurement instrument: calm hierarchy, persistent source/estimate distinction, compact calibration and quality readout, precise evidence table, restrained motion, and clear exportable receipt. Strength: maximum credibility and legibility. Risk: familiar clinical-dashboard aesthetics may erase the hackathon wow.

The likely synthesis is: use the cinematic chamber as the overall composition, take the Evidence Lens as the signature boundary-teaching interaction, and keep the scientific instrument's persistent quality/provenance language. Cut the literal multi-step capture ceremony from the first-screen demo; the bundled replay must reach the X-ray reveal in one click.

## Accessibility and responsive acceptance

- Semantic controls and headings; visible keyboard focus; canvas is not the only carrier of essential information.
- WCAG AA contrast for text and controls.
- 16px minimum body size; comfortable line height; limited measure.
- Touch targets at least 44 by 44 CSS pixels.
- Fully usable at 375, 414, 768, 1024, and 1440px without horizontal overflow.
- `prefers-reduced-motion` disables orbit/reveal choreography and offers direct state changes.
- Provide a textual motion summary and evidence legend for assistive technology.

## Required verification

Automated:

- build and TypeScript pass;
- deterministic metric calculation or receipt integrity;
- same fixture yields same values;
- mirroring swaps left/right labels but preserves magnitudes within tolerance;
- insufficient-evidence fixture abstains;
- claims linter rejects a seeded diagnostic/prognostic phrase;
- every numeric handoff value maps to a receipt field.

Browser verification:

- golden replay completes;
- illustrative fork changes only the ghost layer and updates the exact parameter label;
- insufficient-evidence path visibly abstains;
- professional handoff opens and cites source values;
- keyboard path and reduced-motion state work;
- viewports 375, 768, 1024, and 1440 render without overflow or blocked controls.

## Build-story requirement

The repository should retain inspectable receipts showing:

`research -> three interface directions -> Fable spec -> frozen manager spec -> Cursor GPT-5.6 implementation -> tests -> browser proof -> residual limitations`

Do not claim that clinical validation or medical-device work was compressed into hours. The safe close is:

`Codex compressed the distance from idea to testable evidence. It did not compress the standard of evidence.`

## Fable assignment

Return one decisive implementation specification, not a brainstorm. Include:

1. product thesis and novelty wedge;
2. exact end-to-end user flow and state machine;
3. information architecture and responsive layout;
4. art direction, type scale, typeface roles, palette, motion language, and accessibility rationale;
5. 3D scene composition and animation beats;
6. component and module map;
7. data contracts and deterministic fixture strategy;
8. metric/receipt logic at prototype level;
9. live-camera progressive enhancement boundary;
10. copy deck for every major state, including abstention and handoff;
11. acceptance tests and browser test matrix;
12. explicit cuts and prohibited claims;
13. Cursor implementation sequence optimized for one focused engineering pass;
14. a 60-second judge demo script;
15. a final `frozen decisions` checklist that an engineer can execute without asking product questions.

When spectacle and evidence conflict, preserve the spectacle by changing the presentation—not by overstating what was measured.
