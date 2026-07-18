# Motion X-Ray — live runtime correction pass 1

You are correcting an already-working React/TypeScript browser motion-analysis MVP. Do not redesign it. Preserve the current visual system, evidence labels, synthetic fallback, and claim-safe wording.

## Runtime evidence that triggered this pass

The browser successfully loaded the bundled MediaPipe Pose Landmarker model and local WASM, then analysed an uploaded Sports2D video. A second upload in the same browser session failed with:

`Packet timestamp mismatch ... Current minimum expected timestamp is 7700001 but received 0`

The source media timestamp restarted at zero, while the shared MediaPipe graph requires globally monotonic inference timestamps. This is a real runtime blocker.

## Required corrections

1. Separate the MediaPipe graph clock from the media/sample clock.
   - Every call into `PoseLandmarker.detectForVideo` must receive a strictly increasing timestamp for the lifetime of that graph, including when a new camera/file source starts at zero.
   - Preserve the original media/sample timestamp on the returned `MotionFrame`; receipts and gait timing must remain based on media time, not wall-clock processing time.
   - Add deterministic unit coverage for two logical sources that both begin at zero. Prefer a small pure clock helper or an injectable seam instead of mocking MediaPipe internals.

2. Do not silently discard failed pose samples.
   - A scheduled sample with no pose must remain represented in capture quality so `posePresenceRate` cannot be inflated by considering only successful detections.
   - Use a schema-valid 33-landmark placeholder with zero visibility, or an equally deterministic representation compatible with the existing fixture schema and algorithms.
   - Overlay/progress must still report `posePresent: false` and `lastFrame: null` for that sample.
   - Add a test proving a capture with 50% missing detections reports approximately 0.5 presence and abstains.

3. Wait for decoded video pixels, not metadata alone.
   - `FileCaptureSession` must wait until `readyState >= HAVE_CURRENT_DATA` / `loadeddata` before the first inference, including the timestamp-zero frame.
   - Keep object URL cleanup correct on success, cancel, and error.
   - Accept `.ogv` as a local video extension when MIME is absent.

4. Remove double camera acquisition.
   - Feature/probe checks must not open and stop a camera stream before `CameraCaptureSession` opens the real stream.
   - The capture session should own the only `getUserMedia` stream and stop every track on cancel, completion, and error.

5. Preserve terminal errors.
   - A camera inference error must reject/throw through `start()` so App does not continue into ordinary empty-frame processing and replace the error with an abstention result.

6. Make framing usable for a solo demo.
   - Give the user at least 2 seconds of visible framing time before the existing countdown. Keep the total interaction concise.

7. Use existing frame-gap evidence.
   - Add a stable, inspectable quality reason for materially gapped capture if justified by the existing `frameGaps` metric. Do not reject for one browser scheduling hiccup; use a deterministic ratio/threshold and test it.

## Constraints

- No server, uploads, accounts, analytics, cloud inference, or CDN runtime dependency.
- No diagnosis, prediction, treatment, personalised anatomy, force, tissue stress, or “3D X-ray” claim.
- Do not weaken the existing adversarial gates merely to accept a demo video.
- Do not add a dependency unless unavoidable.
- Keep strict TypeScript and current architecture.
- Do not touch files outside this app directory.

## Verification contract

Run and make all pass:

- `npm test`
- `npm run lint:claims`
- `npm run build`

Report exactly which files changed, which tests were added, and any remaining runtime caveat. Do not claim browser success; the supervising engineer will perform that independently.
