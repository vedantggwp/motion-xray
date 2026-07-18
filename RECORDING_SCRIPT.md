# Motion X-Ray — 90-second screen recording

No slides. Record the working product in the Codex in-app browser. Keep the pointer visible and the browser large enough that the receipt numbers can be read.

## Before recording

- Reload the local app at `http://127.0.0.1:5173/`.
- Confirm **Run real video proof** is visible.
- Close unrelated tabs and notifications.
- Use the laptop microphone; speak slightly slower than normal.
- macOS: `Shift + Command + 5` → record selected portion → include the app and no private desktop content.
- Stop at 85 seconds if possible; the hard form limit is 90 seconds.

## Spoken script and actions

### 0 to 7 seconds: cold open

Action: hold on the landing view and 3D figure.

> What if your body could open a pull request? This is Motion X-Ray, built today with Codex.

### 7 to 17 seconds: real source

Action: click **Run real video proof**.

> It takes a real twelve-second walking video, runs MediaPipe locally in the browser, and turns thirty-three estimated landmarks per frame into a replayable motion model. The video is never uploaded.

### 17 to 32 seconds: watch inference

Action: let the real video and pose overlay run. Point briefly to the skeleton and progress state.

> Codex assembled the capture protocol, bundled model and WebAssembly runtime, temporal event detector, evidence gates, and the 3D interface—then tested the system against good and deliberately bad footage.

### 32 to 49 seconds: receipt resolves

Action: when the 3D result appears, point to left/right intervals, event ribbon and knee estimates.

> This is not a diagnosis or an X-ray. It is an inspectable motion receipt: camera-relative timing, variation and knee estimates, all calculated deterministically from the captured landmarks.

### 49 to 68 seconds: show the professional outcome

Action: click **Open motion observation report**.

> The outcome is a printable Motion Observation Report. Its structure is informed by clinical movement-analysis reporting, but it does not pretend to be a clinical report. It carries the capture conditions, quality, observed measures, missing context, method and questions a professional can actually assess.

### 68 to 79 seconds: show refusal

Action: close the report, then click **View the poor-capture demo**.

> And when the evidence is weak, it refuses to report timing at all. The safest number is sometimes no number.

### 79 to 90 seconds: Codex close

Action: return pointer to the provenance line or product name.

> Codex made the previously impractical build possible in hours: research, integration, 3D product engineering and adversarial testing. It compressed months of work—not the standard of evidence.

## Fallback recording path

If real-video inference fails during the take:

1. Reload.
2. Click **Run the bundled replay**.
3. Keep the spoken claim honest: say `deterministic offline replay` rather than `this video was just analysed`.
4. Still show Measurement receipt and the poor-capture refusal.
