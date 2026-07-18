# Cursor implementation brief — Motion X-Ray MVP

Role: act as the senior hands-on product engineer responsible for the complete local MVP. You are implementing a frozen product contract, not brainstorming it.

Model requested by the product owner: Cursor Grok 4.5 High Fast.

Workspace ownership: every implementation change must stay inside this `motion-xray-mvp` directory. Do not inspect or modify parent workspace files. Other people and agents are working in the wider repository; never revert or reformat their work.

## Read first

Read these files completely before editing:

1. `FABLE_INPUT.md` — source intent and evidence boundaries.
2. `FABLE_SPEC.md` — manager-reviewed frozen implementation specification; this is authoritative when the two files differ.

## Mission

Build the complete polished browser MVP described in `FABLE_SPEC.md` using Vite, React, TypeScript, React Three Fiber, and minimal dependencies. The bundled deterministic replay is the release path. The result should look like a high-end interactive scientific instrument with a cinematic 3D focal point, not a generic dashboard or a skeleton tutorial.

Do not stop at scaffolding. Implement the app, fixtures, deterministic receipt logic, 3D scene, responsive interface, tests, claims checks, accessibility support, and documentation. Run the checks available to you and fix failures before returning.

## Staff-level engineering constraints

### Architecture

- One page, one immutable reducer, no router, no state library, no backend.
- Keep the deterministic evidence path separate from presentation choreography.
- All displayed numbers come from a typed `MotionReceipt`; components do no new metric arithmetic.
- All user-facing product strings live in one copy module.
- Generate fixtures with a seeded script and commit the generated fixture data.
- The bundled replay must work without a camera, API key, or post-install network access.
- The 3D figure must be procedural: generic landmark spheres plus rods/lines, not an anatomical model.
- Use a single replay clock and reuse Three.js objects/materials; do not recreate geometry every frame.
- Lazy-load live-camera code so it cannot increase golden-path failure risk.

### Scientific and claim boundary

- Never present the generic rig as anatomy, medical imaging, a scan, a digital twin, or a biomechanical reconstruction.
- Never render or assert personalised tissue stress, forces, moments, muscle state, degeneration, injury probability, future outcome, treatment effect, or diagnosis.
- The illustrative fork may mutate only a separate dotted amber ghost. It must not mutate observed frames, receipt values, or the source rig.
- Poor evidence must visibly abstain and must not expose timing values.
- Keep evidence classes persistent and distinguish them by style as well as colour.
- Implement a context-aware claims linter. It must block seeded affirmative unsafe claims but allow explicit negation and `not established` language.

### 3D and visual bar

- The hero must show a moving 3D figure before interaction.
- Use a near-black observation chamber, off-white observed rig, cyan left trace, amber right/illustrative trace, and violet-grey uncertainty.
- Include a restrained floor grid, accepted contact pulses, bounded heel/ankle trails, a fixed three-quarter camera, and no more than four degrees of slow drift.
- Add the resolving choreography, but compute the receipt first. Under reduced motion, skip choreography and camera drift.
- The Evidence Lens must be a real interaction: focusing/hovering/tapping a class visually emphasizes the matching layer and explains it in text.
- Avoid generic AI gradients, excessive glassmorphism, injury-red body heatmaps, dense sci-fi HUD chrome, and dashboard card walls.
- Use Newsreader only for the hero and handoff headline, IBM Plex Sans for UI/body, IBM Plex Mono for data/provenance.

### Responsive and accessible behavior

- Mobile-first; verify 375px and 414px layouts.
- At 375–414px, cap the 3D stage near 52vh and keep evidence/action controls immediately reachable.
- At 1024px+, use stage plus a roughly 380px evidence rail.
- No horizontal overflow at any required viewport.
- Minimum 44px pointer targets, visible focus, logical document/tab order, Escape closes the top overlay.
- The canvas is never the only source of meaning. Provide a live textual summary from the receipt and an accessible evidence legend.
- Respect `prefers-reduced-motion` in both CSS and Three.js behavior.

### Live camera

Implement the progressive enhancement boundary cleanly. At minimum:

- provide a real `getUserMedia` permission/probe flow with a local video preview;
- define the normalized `MotionSource` interface;
- isolate the MediaPipe adapter behind a lazy import or a clear availability boundary;
- if a working Pose Landmarker can be integrated without weakening the fixture path, do it;
- otherwise show the exact honest `live unavailable` state and keep the bundled experience intact.

Do not fake successful live analysis.

## Required tests

Use Vitest for deterministic/unit checks. Implement and run:

1. fixture schema validation;
2. deterministic receipt equality;
3. semantic mirror transform (`x -> 1 - x` plus left/right landmark identity swap) swaps labels while preserving magnitudes;
4. insufficient evidence abstains and cannot surface timing display fields;
5. every handoff number maps to a receipt field;
6. context-aware claims lint accepts boundary copy and rejects seeded affirmative diagnosis/prognosis/force/treatment claims;
7. reducer transition table and illegal-event no-ops;
8. TypeScript and production build.

Do not weaken a failing test to make it green unless the test contradicts the manager-reviewed spec.

## Implementation quality

- Prefer small pure functions and explicit types over abstractions.
- Do not leave `TODO`, placeholder buttons, dead controls, fabricated test status, or fake loading screens.
- Do not hard-code visible metric values inside components or copy. Derive display view models from the receipt once.
- Avoid `any`, broad type assertions, console noise, and silent catches.
- Any fallback must be visible and truthful.
- Keep dependencies minimal and document licences/attribution in the README.

## Documentation and receipts

Create or update:

- `README.md`: product boundary, local run commands, architecture, evidence classes, test commands, live-camera status, known limitations, and judge demo flow.
- `BUILD_RECEIPT.md`: implementation model, start date, files/artifacts, commands actually run, test results actually observed, browser proof placeholders (do not invent screenshots), and residual work.

The receipt must say `Cursor Grok 4.5 High Fast` for implementation. Never claim clinical validation, production readiness, privacy compliance, or a measured months-saved number.

## Done condition

Return only after:

- the accepted fixture runs through the complete visual path;
- the poor fixture visibly closes with no timing comparison;
- the illustrative fork changes only the ghost;
- the handoff and accessible text summary use source receipt values;
- the project builds;
- the required unit tests pass or you have reported a precise external blocker that cannot be solved inside this directory.

In your final response, list changed files, exact commands/results, implementation compromises, live-camera status, and anything the reviewing engineer must verify in a real browser.
