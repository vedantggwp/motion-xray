# Cursor live review 7 — one-click real-video judge path

Time-boxed final-demo change. Implement surgically in the existing Motion X-Ray app. The in-app Codex browser renders the page and bundled replay cleanly, but its automated camera/device permission path stalls and its file-chooser bridge does not attach a file. We need a reliable one-click **real inference** path for a maximum-90-second screen recording.

## Licensed source asset

Copy `/tmp/mixkit-full-body-walk.mp4` into a sensible path under `public/demo/`.

Source page: `https://mixkit.co/free-stock-video/young-man-walking-listening-to-music-from-his-headphones-4855/`

The page describes a full-body profile walk, 12 seconds / 30 fps, downloadable under the Mixkit Stock Video Free License. Do not rename or describe the person in a health context. Add source and licence attribution to README/BROWSER_PROOF and a small repository attribution file next to the asset. Do not claim endorsement by Mixkit or the person.

## Required product path

1. Add a primary hero action: **Run real video proof**.
   - This fetches the bundled same-origin MP4, creates a browser `File`, and sends it through the exact existing `handleFile` → `FileCaptureSession` → MediaPipe → deterministic receipt pipeline.
   - No precomputed landmarks or hard-coded receipt values.
   - No network dependency at runtime beyond the local app origin.
2. Keep **Run the bundled replay** as the fast offline fallback, but demote it visually. Keep **Choose a source** for camera/user video. Avoid four competing hero actions; the poor-capture control already exists after receipt and inside source picker.
3. Also expose the real-video proof action inside the source picker.
4. Label the resulting fixture **Independent full-body walk · real video proof** (or equally clear wording) while retaining `source: local-video`. The provenance chain must continue to say local video pixels → MediaPipe → receipt → 3D replay.
5. During processing, preserve the existing video + 2D pose overlay and progress UI.
6. Failure handling: if the local asset fetch fails or is empty/invalid, surface the existing error banner and leave the fallback available. Do not silently swap to the synthetic receipt.
7. Add the strongest small tests without a new dependency:
   - demo asset loader success returns a non-empty MP4 `File`/Blob with the stable label/path contract
   - non-OK/empty response fails explicitly
   - no precomputed receipt/landmark fixture is involved
8. Update copy, README judge flow, MANIFEST, BUILD_RECEIPT and BROWSER_PROOF. Do not claim the in-app-browser path passes until the manager reruns it.
9. Run `npm test`, `npm run lint:claims`, and `npm run build`.

## Constraints

- No redesign beyond action hierarchy/helper copy required for this path.
- No API/backend/CDN.
- No new runtime dependency.
- Do not weaken any measurement gate or special-case the clip's metrics.
- Public receipt still excludes raw pixels, filenames/paths, frames and landmarks.
- Keep camera and user-upload paths intact.

At the end report files, asset hash/size, tests, and exact click path for manager verification.
