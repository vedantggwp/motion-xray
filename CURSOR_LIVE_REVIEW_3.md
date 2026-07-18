# Cursor live review 3 — make the browser result inspectable

You are implementing a surgical evidence/debug pass in the existing Motion X-Ray app. Work directly in this repo. Do not redesign the app and do not weaken any quality threshold merely to make a demo pass.

## Why this pass exists

A clean 11.88 s, 1280×720, 29.97 fps, full-body profile walking clip passed every quality gate except `insufficient-events-per-side`. The app currently hides the counts and event evidence when it abstains, so we cannot tell whether this is a valid abstention or an event-detector defect.

## Required implementation

1. Extend `QualityReport` and the fixture receipt schema with explicit, deterministic evidence fields:
   - `sampledFrameCount`
   - `leftCandidateCount`, `rightCandidateCount`
   - `leftAcceptedCount`, `rightAcceptedCount`
   - rejected counts by reason (`low-visibility`, `discontinuity`) and side, or another equally inspectable typed representation
   - duration, pose presence, foot visibility, frame gaps, teleport frames, interval CVs, alternation score already exist; preserve them
2. Add a compact `Measurement receipt` disclosure/button available for both accepted and abstained results.
   - It must show the above fields, quality grade, reason codes, source kind, fixture ID, MediaPipe package/model identity, and model SHA-256 already documented in this repo.
   - Use honest labels: `candidate heel-low events`, `accepted heel-low event estimates`, `capture gate`, not heel strikes, diagnosis, or clinical grade.
   - Abstention must continue to hide timing/asymmetry and knee outputs while showing capture evidence.
3. Add `Download receipt JSON`. Export only the deterministic receipt plus provenance metadata. Do not export raw frames, landmarks, source pixels, video name/path, blobs, or object URLs.
4. Add an explicitly development-only fixture export seam so we can diagnose the real browser clip without shipping personal capture data:
   - In development mode only (`import.meta.env.DEV`), expose the current `MotionFixture` and receipt on a clearly named `window.__MOTION_XRAY_DEBUG__` object.
   - Remove it on unmount and update it when fixture/receipt changes.
   - Add a TypeScript global declaration and a test/assertion that the production build does not contain the debug global string if practical. If Vite cannot dead-code-eliminate it under the chosen form, prefer a dev-only UI download button for the full fixture instead, hidden from production.
5. Tests:
   - quality evidence counts equal the actual `events` array partitions
   - accepted synthetic fixture still passes unchanged
   - insufficient fixture exposes evidence but timing display stays unavailable
   - public receipt download contains no `frames`, `landmarks`, file names, blobs, or object URLs
   - all prior tests remain green
6. Update `README.md` and `BUILD_RECEIPT.md` with the new inspectability/export behaviour. Do not claim positive real-video acceptance yet.

## Constraints

- Keep existing architecture and visual language.
- No new runtime dependency.
- No server or upload.
- No special-casing a fixture ID, filename, duration, or source.
- Do not change `MIN_ACCEPTED_PER_SIDE`, event thresholds, or quality gates in this pass.
- Do not expose or persist raw capture data outside the dev-only seam.
- Run `npm test`, `npm run lint:claims`, and `npm run build` before finishing.

At the end, summarize exact files changed, tests run, and any evidence that the current event detector may be under-counting without guessing at a fix.
