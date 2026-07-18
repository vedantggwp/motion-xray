# Motion X-Ray — headed-browser proof

Date: 2026-07-18

Browser targets: headed Chromium through `agent-browser` and the visible Codex in-app browser
App: local Vite development server at `http://127.0.0.1:5173/`

## Positive control: independent full-body walk

Source: Mixkit, [Young man walking listening to music from his headphones](https://mixkit.co/free-stock-video/young-man-walking-listening-to-music-from-his-headphones-4855/). The source page describes a full-body profile walk, 12 seconds at 30 fps, downloadable under the Mixkit Stock Video Free License. No endorsement by Mixkit or the person is claimed. Repository copy: `public/demo/mixkit-full-body-walk.mp4` (SHA-256 `011209fbf780baa5ae05e9ea020c70bdb4de1580f04d3d6bcb4aa74da205d935`, 3,806,256 bytes) with `public/demo/ATTRIBUTION.md`.

Observed file metadata: H.264, 1280×720, 29.97 fps, 11.8785 seconds.

**One-click in-app path (CURSOR_LIVE_REVIEW_7):** verified in the visible Codex in-app browser on 2026-07-18. The hero action **Run real video proof** fetched this same-origin MP4 into a browser `File` and ran the real inference pipeline. No precomputed landmarks or receipt values were used.

Observed receipt after the local-maxima detector correction:

| Evidence | Browser result |
|---|---:|
| Capture gate | `accepted` |
| Sampled frames | 238 |
| Analysed duration | 11,850 ms |
| Pose presence | 0.9958 |
| Mean foot visibility | 0.9374 |
| Frame gaps | 0 |
| Teleport frames | 0 |
| Candidate / accepted events, left | 11 / 11 |
| Candidate / accepted events, right | 11 / 11 |
| Rejected events | 0 |
| Alternation score | 1.0 |
| Left interval CV | 0.1135 |
| Right interval CV | 0.1628 |
| Left median same-side interval | 1,050 ms |
| Right median same-side interval | 1,050 ms |
| Paired timing delta | 0 ms / 0% |
| Left knee flexion range | 42.4° camera-plane estimate |
| Right knee flexion range | 49.9° camera-plane estimate |

The app rendered the captured landmark sequence as a replayable 3D evidence view and surfaced the deterministic receipt. It did not label the events heel strikes or the knee values clinical range of motion.

The in-app browser result matched the prior manual-attach control: 238 frames, 11/11 accepted events on each side, 0 rejected events, alternation 1.0, 1,050 ms median same-side interval on each side, 42.4° / 49.9° camera-plane knee ranges and grade `accepted`. The Measurement receipt opened and exposed pose presence 0.996, mean foot visibility 0.937, frame gaps 0, teleport frames 0, both interval CVs, package/model identity and the model SHA-256.

The same file was run again after the negative control, without reloading the browser. It again returned 238 frames, 11/11 accepted events, alternation 1.0 and grade `accepted`. The browser error log was empty. This verifies the per-source MediaPipe timestamp reset that previously failed on a second upload.

## Negative control: poor / multi-person framing

Source: the open Sports2D repository's `Sports2D/Demo/demo.mp4`.

Observed receipt after the same detector correction:

| Evidence | Browser result |
|---|---:|
| Capture gate | `insufficient` |
| Reason code | `irregular-intervals` |
| Sampled frames | 155 |
| Analysed duration | 7,700 ms |
| Pose presence | 0.9484 |
| Mean foot visibility | 0.7937 |
| Candidate / accepted events, left | 9 / 7 |
| Candidate / accepted events, right | 8 / 7 |
| Rejected low-visibility events | 3 |
| Left / right interval CV | 0.5031 / 0.5964 |
| Alternation score | 0.7692 |

The visible UI closed the capture, reported the reason code and withheld timing, asymmetry and knee outputs. The opened Measurement receipt still exposed the capture evidence and model provenance.

## Runtime and privacy proof

- The browser loaded the bundled `pose_landmarker_full.task` and local MediaPipe WASM successfully; no CDN or API key was used.
- Public receipt JSON is tested to exclude frames, landmarks, source pixels, filenames, paths, blobs and object URLs.
- The Mixkit positive-control clip is now committed under `public/demo/` for the one-click judge path; the Sports2D negative-control clip was read from `/tmp` / the Sports2D repo and is not committed here.
- The development-only fixture seam is absent from the production JavaScript bundle.
- Final independent verification after the one-click browser pass: 21 test files / 59 tests passed, claims lint scanned 123 centralized strings, and the TypeScript/Vite production build succeeded.

## Receipt download — app contract proven; automation interception remains unavailable

A headed Chromium pass through the visible **Download receipt JSON** button did **not** produce the requested file even though the Measurement receipt opened and public-export unit tests passed. Initial cause: `downloadPublicReceiptJson` revoked the blob object URL immediately after `anchor.click()`, which can race the browser/automation download start.

Review 5 deferred revoke with `setTimeout(..., 0)` while still removing the temporary anchor immediately. That change passed unit tests but **still failed** headed-browser verification: `agent-browser download` again waited for a download event and no requested file appeared; browser error log stayed empty.

Code fix (CURSOR_LIVE_REVIEW_6): keep both the temporary anchor and blob URL alive after click; remove the anchor and revoke the URL together after an explicit 1,000 ms delay; privacy contract and filename unchanged; lifecycle unit test asserts append → click → neither remove nor revoke synchronously → both only after the delay.

Review 6 keeps the anchor and blob URL alive for 1,000 ms and its lifecycle unit test passes. A later `agent-browser download` check still did not observe a download event; the same harness also hung on a plain persistent data-URL download control. This isolates an automation-download interception limitation rather than proving an app failure, but the physical saved file remains unverified. Browser-side serialization was inspected directly: 4,700 bytes with no frames, landmarks, blobs or source media identifiers.

## Proof screenshots

- `browser-proof/live-mixkit-accepted.png` — positive result and 3D replay
- `browser-proof/live-mixkit-accepted-full.png` — full positive result
- `browser-proof/live-mixkit-accepted-receipt-full.png` — accepted result with Measurement receipt open
- `browser-proof/live-sports2d-postfix-abstained-full.png` — post-fix negative-control abstention
- `browser-proof/live-sports2d-receipt-inspector-full.png` — abstention evidence receipt

## Claim ceiling

This proves a working local browser pipeline and deterministic receipt on these controls. It does not prove clinical validity, general accuracy across people/cameras/clothing/conditions, force or tissue estimates, diagnosis, prognosis, or production readiness.
