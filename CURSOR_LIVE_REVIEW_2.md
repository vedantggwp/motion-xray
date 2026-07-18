# Motion X-Ray — real-video event correction pass 2

Do a narrowly scoped correction to the existing deterministic gait-event layer. Preserve all UI, quality thresholds, claim boundaries, local-only inference, and prior tests.

## Browser evidence

Three unrelated, real videos now complete local MediaPipe inference without runtime errors:

1. CC BY treadmill clip with rail/torso occlusion: correctly abstains for missing pose / poor foot visibility.
2. CC BY laboratory lower-body treadmill clip: correctly abstains for missing pose.
3. The public StrideIQ repo's own 1080p, side-on, single-runner demo: pose presence and foot visibility pass, but the receipt finds fewer than five events per side and abstains only for `insufficient-events-per-side`.

The third result exposes a weakness in our signal, not a reason to weaken the gate. `stepEvents.ts` thresholds absolute image-space heel Y across the whole clip. Camera pan, ground slope, subject translation/scale, and schema-valid zero-visibility placeholder frames can dominate the global min/max and erase true periodic crossings.

## Existing-source grounding

- The inspected MIT `sarweshshah/gait_analysis` implementation smooths ankle/heel trajectories, detects extrema with a refractory distance, and includes ankle-relative-to-hip features.
- Published monocular gait workflows commonly make foot trajectories relative to the torso/pelvis to remove global motion before detecting gait events.

We are still reporting only a deterministic `heel-low event estimate`, not a measured heel strike.

## Required changes

1. Make the heel-low signal body-relative and visibility-aware.
   - Replace absolute heel Y with vertical heel position relative to a robust hip/pelvis reference (mid-hip when available; visibility-aware fallback is acceptable).
   - Do not allow zero-visibility placeholder coordinates to influence signal min/max or smoothing.
   - Deterministically interpolate only short missing runs for signal continuity. Event confidence windows and capture quality must still use original visibility; never turn an absent sample into accepted evidence.
   - If there is not enough valid dynamic range, emit no events.
   - Preserve refractory, visibility, discontinuity, interval-CV, alternation, and minimum-event gates.

2. Add adversarial regression tests.
   - Applying a smooth global vertical translation/pan to every landmark in the accepted fixture should not materially change detected event timestamps/counts or acceptance.
   - A small number of zero-visibility placeholder frames should not poison the entire signal or erase otherwise-supported events.
   - The existing 50%-missing test must continue to abstain.
   - Constant/random/shuffled/short captures must continue to abstain.

3. Improve graph-clock fidelity from review 1.
   - The graph timestamp must remain strictly increasing across a source reset, but should preserve the new source's within-source media deltas instead of advancing only 1 ms per frame until media time catches up.
   - Example: source A graph/media `[0,50,100,150]`; source B media `[0,50,100]` should become graph `[151,201,251]`, not `[151,152,153]`.
   - Keep `MotionFrame.timestampMs` unchanged as media/sample time.

## Non-goals

- Do not special-case filenames, demo IDs, values, or individual videos.
- Do not lower `MIN_ACCEPTED_PER_SIDE`, presence, foot visibility, interval-CV, alternation, or temporal-discontinuity thresholds.
- Do not add diagnoses, recommendations, clinical ranges, outcome predictions, force/tissue claims, or personalised anatomy.
- Do not claim browser acceptance in your report; supervising engineer verifies independently.

## Verification

Run:

- `npm test`
- `npm run lint:claims`
- `npm run build`

Report exact files changed, tests added, and remaining caveats.
