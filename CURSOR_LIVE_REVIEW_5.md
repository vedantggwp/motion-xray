# Cursor live review 5 — make the receipt download work in a real browser

Implement this surgical runtime fix in the existing Motion X-Ray app.

## Reproduced failure

The accepted Measurement receipt opens and the public export unit tests pass, but a headed Chromium download through the visible `Download receipt JSON` button never produced the requested file. `downloadPublicReceiptJson` currently calls `URL.revokeObjectURL(url)` immediately after `anchor.click()`. The blob URL can be revoked before the browser/automation consumes the download.

## Required change

1. Fix the blob/anchor lifecycle so the object URL is revoked asynchronously after the click has had a browser task to start. Keep cleanup bounded; do not leak URLs or leave anchors in the DOM.
2. Preserve the current public-export privacy contract and filename behaviour.
3. Add the strongest practical deterministic test for the download lifecycle without adding a runtime dependency. At minimum, verify click happens before revoke and that cleanup occurs after the deferred boundary. Use fake timers/mocks if appropriate.
4. Update `BUILD_RECEIPT.md` and `BROWSER_PROOF.md` to say the browser download was initially blocked by premature URL revocation and must be rerun after this change. Do not claim the browser download works until the manager reruns it.
5. Run `npm test`, `npm run lint:claims`, and `npm run build`.

Constraints: no UI redesign, no new dependency, no raw frames/landmarks/media in the public export, no indefinite timers.
