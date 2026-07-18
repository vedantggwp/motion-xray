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

### 0–7 s — cold open

Action: hold on the landing view and 3D figure.

> What if your body could open a pull request? This is Motion X-Ray, built today with Codex.

### 7–17 s — real source

Action: click **Run real video proof**.

> It takes a real twelve-second walking video, runs MediaPipe locally in the browser, and turns thirty-three estimated landmarks per frame into a replayable motion model. The video is never uploaded.

### 17–32 s — watch inference

Action: let the real video and pose overlay run. Point briefly to the skeleton and progress state.

> Codex assembled the capture protocol, bundled model and WebAssembly runtime, temporal event detector, evidence gates, and the 3D interface—then tested the system against good and deliberately bad footage.

### 32–53 s — receipt resolves

Action: when the 3D result appears, point to left/right intervals, event ribbon and knee estimates.

> This is not a diagnosis or an X-ray. It is an inspectable motion receipt: camera-relative timing, variation and knee estimates, all calculated deterministically from the captured landmarks.

### 53–68 s — prove it is not AI slop

Action: open **Measurement receipt**.

> Every result carries its proof: sampled frames, pose presence, foot visibility, accepted and rejected events, regularity, model identity and the exact model checksum. No hidden language model invents these numbers.

### 68–78 s — show refusal

Action: click **View the poor-capture demo**.

> And when the evidence is weak, it refuses to report timing at all. The safest number is sometimes no number.

### 78–90 s — Codex close

Action: return pointer to the provenance line or product name.

> Codex made the previously impractical build possible in hours: research, integration, 3D product engineering and adversarial testing. It compressed months of work—not the standard of evidence.

## Fallback recording path

If real-video inference fails during the take:

1. Reload.
2. Click **Run the bundled replay**.
3. Keep the spoken claim honest: say `deterministic offline replay` rather than `this video was just analysed`.
4. Still show Measurement receipt and the poor-capture refusal.
