# Cursor live review 4 — replace the under-counting event rule

Implement this surgical detector correction in the existing Motion X-Ray app. Work directly in this repo. Do not redesign the UI, weaken quality gates, or special-case the test clip.

## Browser evidence that motivates the change

A real 11.85 s full-body profile walk produced:

- 238 sampled frames
- pose presence 0.9958
- mean foot visibility 0.9374
- 0 frame gaps, 0 teleport frames
- current candidates/accepted: left 6, right 4
- no rejected candidates
- only reason code: `insufficient-events-per-side`

The browser-local body-relative heel series remains strongly periodic after 5 s, but the current global range threshold-entry rule stops emitting most cycles because later peaks are slightly lower. A read-only local-maxima experiment over the exact same smoothed, hip-relative signals recovered 11 left / 11 right candidates at the 60th percentile threshold with a 500 ms same-side refractory window.

This is a detector defect, not evidence that the capture is bad.

## Existing-work basis

- The MIT-licensed `sarweshshah/gait_analysis` gait-events implementation smooths the heel/ankle trajectory and detects extrema with a percentile threshold and minimum peak distance.
- The public StrideIQ implementation independently uses local maxima of heel Y plus a percentile threshold, but its repo has no explicit app license. Do not copy its code. The concept only confirms this is an established approach.

## Required implementation

1. In `src/metrics/stepEvents.ts`, replace global low-band **entry crossing** detection with deterministic local maxima detection on the existing smoothed, body-relative heel signal:
   - image Y increases downward, so a local maximum is the low-heel point
   - compute the threshold from originally valid, smoothed samples only using a deterministic 60th percentile
   - candidate condition: center sample is at/above threshold and is a strict-or-right-tied local maximum (`center > previous && center >= next`, or an equivalent deterministic plateau rule)
   - retain the 500 ms same-side refractory window
   - retain visibility confidence and discontinuity acceptance rules exactly
   - keep zero-visibility placeholders out of smoothing/threshold evidence as today
   - do not call these heel strikes; keep `heel-low event estimate`
2. Remove obsolete low-band constants/comments. Add a small typed percentile helper locally or in an existing metrics utility; no dependency.
3. Add regression tests that fail under the old algorithm:
   - a clean periodic fixture whose signal amplitude drifts downward across the capture still emits at least 5 accepted events per side and passes capture quality
   - candidate event timestamps sit at local low-heel extrema, not threshold-entry crossings
   - a constant signal emits no events
   - a noisy/random/shuffled/truncated fixture remains insufficient via existing gates
   - existing translation invariance and short missing-run tests remain green
4. Update research/build docs to record the detector correction, its open-source basis, and the exact real-browser evidence above. Do not claim the real clip is accepted until it is rerun after this change.
5. Run `npm test`, `npm run lint:claims`, and `npm run build`.

## Constraints

- Do not change `MIN_ACCEPTED_PER_SIDE`, visibility gates, interval CV gate, alternation gate, gap gates, or teleport gates.
- Do not key behavior on fixture/source/file metadata.
- No new dependency.
- Do not copy code from StrideIQ.
- Preserve deterministic output and existing public receipt privacy behaviour.

At the end, report exact event rule, files changed, tests, and any remaining uncertainty.
