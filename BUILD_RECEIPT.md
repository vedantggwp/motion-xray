# Motion X-Ray MVP — Build Receipt

Date: 2026-07-18

Implementation model: **Cursor Grok 4.5 High Fast**

Workspace: `workstreams/motion-xray-mvp` only
Brief: `CURSOR_LIVE_REVIEW_7.md`

## Story chain

`research -> open-source stack decision -> Fable spec -> fixture MVP -> live MediaPipe pipeline -> live review 1/2/3/4/5/6 -> one-click real-video proof path (this) -> tests -> claims lint -> production build -> residual limitations`

## This pass — one-click real-video proof path

In-app browser camera/file-chooser automation stalls, so judges need a reliable one-click **real inference** path for a ≤90s screen recording. This pass bundles a licensed Mixkit full-body walk under `public/demo/`, fetches it same-origin into a browser `File`, and runs the exact existing `handleFile` → `FileCaptureSession` → MediaPipe → deterministic receipt pipeline. No precomputed landmarks or hard-coded receipt values. Measurement gates unchanged.

| Area | Change |
|---|---|
| Asset | `public/demo/mixkit-full-body-walk.mp4` + `public/demo/ATTRIBUTION.md` |
| Loader | `src/live/demoVideoProof.ts` — fetch → non-empty `File`; explicit fail on non-OK/empty |
| UI | Primary **Run real video proof**; demoted **Run the bundled replay**; **Choose a source**; poor-capture kept after receipt + in picker |
| Label | Fixture label `Independent full-body walk · real video proof`; `source: local-video`; provenance chain unchanged |
| Tests | Demo loader success / non-OK / empty / no precomputed fixture involvement |
| Browser proof | Visible in-app Codex browser: real-video inference accepted; receipt disclosure and poor-capture refusal verified |

### Commands actually run (real-video proof path)

| Command | Result |
|---|---|
| `npm test` | **21 files / 59 tests passed** |
| `npm run lint:claims` | Seeded examples passed; scanned **123** centralized copy strings |
| `npm run build` | **TypeScript + Vite production build succeeded** (`dist/`, including `dist/demo/mixkit-full-body-walk.mp4`) |

Observed test output (2026-07-18, real-video proof path):

```
Test Files  21 passed (21)
Tests  59 passed (59)
```

Asset: SHA-256 `011209fbf780baa5ae05e9ea020c70bdb4de1580f04d3d6bcb4aa74da205d935`, 3,806,256 bytes.

### In-app browser result

- 238 sampled frames over 11,850 ms; pose presence 0.996; mean foot visibility 0.937
- 11/11 accepted events per side; 0 rejected; alternation 1.0; no frame gaps or teleports
- 1,050 ms median same-side interval on both sides; 42.4° / 49.9° camera-plane knee ranges
- Measurement receipt opened with model identity/checksum
- Poor-capture control withheld timing with `poor-foot-visibility` and `insufficient-events-per-side`

### Claims not made

- No clinical validation or production readiness
- No endorsement by Mixkit or the person in the clip
- No weakened gates or clip-specific metric special-casing
- No new runtime dependency / API / CDN

## Prior pass — keep anchor + blob URL alive after download click

Review 5 deferred `URL.revokeObjectURL` with `setTimeout(..., 0)` but still removed the temporary anchor immediately. Headed Chromium / `agent-browser download` again waited for a download event and no requested file appeared; browser error log stayed empty. Review 6 keeps both the temporary anchor and blob URL alive after `anchor.click()`, then removes the anchor and revokes the URL together after an explicit **1,000 ms** bounded delay.

| Area | Change |
|---|---|
| Download lifecycle | Anchor + blob URL stay alive after click; both cleaned together after `DOWNLOAD_CLEANUP_DELAY_MS` (1000) |
| Privacy / filename | Unchanged public-export contract and `motion-xray-receipt-${fixtureId}.json` naming |
| Tests | Lifecycle ordering: append → click → neither remove nor revoke sync → both only after the delay |
| Browser proof | Review 5 zero-delay cleanup failed; review 6 lifecycle test passes, while `agent-browser` download interception also fails on a plain data-URL control |

### Commands actually run (download cleanup delay pass)

| Command | Result |
|---|---|
| `npm test` | **20 files / 55 tests passed** |
| `npm run lint:claims` | Seeded examples passed; scanned **121** centralized copy strings |
| `npm run build` | **TypeScript + Vite production build succeeded** (`dist/`) |

Observed test output (2026-07-18, download cleanup delay pass):

```
Test Files  20 passed (20)
Tests  55 passed (55)
```

### Claims not made (review 6)

- No claim that the headed Chromium download was re-verified after this fix (manager must rerun)
- No clinical validation or production readiness
- No UI redesign; no new dependency
- Review 5's zero-delay revoke is explicitly recorded as still failing headed-browser verification

## Prior pass — deferred blob URL revoke (review 5; headed path still failed)

Headed Chromium could open the accepted Measurement receipt and unit tests for the public export passed, but clicking **Download receipt JSON** never produced the file. Root cause at the time: `downloadPublicReceiptJson` called `URL.revokeObjectURL` immediately after `anchor.click()`. Review 5 deferred revoke to `setTimeout` 0 while still removing the temporary anchor immediately. That change passed unit tests but **did not** fix the reproduced headed Chromium / `agent-browser download` path.

| Area | Change |
|---|---|
| Download lifecycle | Revoke the object URL on a bounded macrotask (`setTimeout` 0) after click; remove the temporary anchor immediately |
| Privacy / filename | Unchanged public-export contract and `motion-xray-receipt-${fixtureId}.json` naming |
| Tests | Lifecycle test: click before revoke; revoke only after the deferred timer boundary |
| Browser proof | Manager rerun still required; later confirmed still failing under review 6 reproduction |

### Commands actually run (download lifecycle pass / review 5)

| Command | Result |
|---|---|
| `npm test` | **20 files / 55 tests passed** |
| `npm run lint:claims` | Seeded examples passed; scanned **121** centralized copy strings |
| `npm run build` | **TypeScript + Vite production build succeeded** (`dist/`) |

Observed test output (2026-07-18, download lifecycle pass):

```
Test Files  20 passed (20)
Tests  55 passed (55)
```

## Prior pass — replace under-counting event rule

Real-browser evidence (11.85 s full-body profile walk) under the prior global range **entry-crossing** rule:

- 238 sampled frames; pose presence 0.9958; mean foot visibility 0.9374
- 0 frame gaps, 0 teleport frames
- candidates/accepted: left 6 / right 4; no rejected candidates
- only reason code: `insufficient-events-per-side`
- read-only local-maxima experiment on the same smoothed hip-relative signals: 11 left / 11 right at 60th percentile + 500 ms refractory

| Area | Change |
|---|---|
| Event rule | Local maxima of smoothed body-relative heel signal at/above 60th percentile of originally-valid samples; 500 ms same-side refractory retained |
| Removed | Global low-band entry-crossing (`LOW_HEEL_BAND_FRACTION`) |
| Labels | Still `heel-low event estimate` — not heel strikes |
| Gates | Unchanged (`MIN_ACCEPTED_PER_SIDE`, visibility, CV, alternation, gaps, teleports) |
| Tests | Amplitude-drift acceptance, extrema-vs-entry timing, constant→no events; prior translation/placeholder + adversarial gates kept |

Open-source basis: MIT `sarweshshah/gait_analysis` (percentile + extrema + min distance); StrideIQ concept-only (no code copied; no explicit app license).

### Post-change headed-browser result

The motivating independent Mixkit clip was rerun through the actual local browser pipeline after the correction and **accepted**:

- 238 sampled frames over 11,850 ms
- pose presence 0.9958; mean foot visibility 0.9374
- 11 left / 11 right candidate and accepted heel-low event estimates; 0 rejected
- alternation 1.0; interval CV 0.1135 left / 0.1628 right
- 0 frame gaps; 0 teleport frames; no reason codes
- 1,050 ms median same-side interval on each side; 0 ms paired delta
- camera-plane knee-flexion ranges 42.4° left / 49.9° right

The Sports2D demo then ran in the same browser session and remained `insufficient` (`irregular-intervals`) with timing withheld. The Mixkit clip ran a second time after that without reload and again produced 11/11 events and grade `accepted`. Browser error log: empty. Full evidence: `BROWSER_PROOF.md`.

### Commands actually run (detector correction pass)

| Command | Result |
|---|---|
| `npm test` | **20 files / 54 tests passed** |
| `npm run lint:claims` | Seeded examples passed; scanned **121** centralized copy strings |
| `npm run build` | **TypeScript + Vite production build succeeded** (`dist/`) |

Observed test output (2026-07-18, detector correction pass):

```
Test Files  20 passed (20)
Tests  54 passed (54)
```

### Claims not made

- No clinical validation or production readiness
- No change to quality-gate thresholds
- No diagnosis / heel-strike / clinical-grade language
- No StrideIQ code reuse

## Prior passes (still valid)

Synthetic accepted-walk receipt magnitudes remain the regression baseline (local-maxima rule should still accept them):

| Field | Value |
|---|---|
| Grade | `accepted` |
| Accepted heel-low events | **22** (left 11 / right 11) |
| Left median same-side interval | **1066 ms** |
| Right median same-side interval | **1133 ms** |
| Paired delta | 67 ms (~6.1%) |

Inspectability (Measurement receipt evidence, public JSON, DEV debug seam) from review 3 remains in place.

## Residual limitations

- Physical **Download receipt JSON** file save remains unverified because the automation harness did not observe downloads from either the app or a plain data-URL control; serialization and cleanup lifecycle are directly tested
- No clinical validation or production readiness claim
- Heel-low events and camera-plane knee angles are capture-relative estimates, not lab kinematics
- Positive and negative browser controls are evidence for this build only, not population-level validation
- World landmarks remain hip-origin metre estimates centred for display — not anatomy
- Main JS chunk remains large due to committed fixtures
