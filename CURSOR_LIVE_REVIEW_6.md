# Cursor live review 6 — download cleanup must survive headed Chromium

The review-5 `setTimeout(..., 0)` change did not fix the reproduced browser path. `agent-browser download` again waited for a download event and no requested file appeared; browser error log stayed empty. The current implementation also removes the temporary anchor immediately.

Implement a stronger, still-bounded lifecycle:

1. Keep both the temporary anchor and blob URL alive after `anchor.click()`.
2. Remove the anchor and revoke the URL together after an explicit short constant delay (use 1,000 ms unless the existing architecture gives a stronger reason for another bounded value).
3. Update the lifecycle test to assert: anchor appended -> click -> neither anchor removal nor URL revoke synchronously -> both occur only after the delay.
4. Update the docs honestly: review 5 zero-delay cleanup still failed headed-browser verification; review 6 awaits manager rerun.
5. Run `npm test`, `npm run lint:claims`, and `npm run build`.

Do not change the receipt payload, filename, privacy contract, UI, or dependencies.
