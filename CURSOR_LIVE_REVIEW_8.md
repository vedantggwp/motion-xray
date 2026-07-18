# Motion X-Ray live review 8: clinician-readable outcome card

## Objective

Turn the existing `Open professional handoff` drawer into the unmistakable product outcome: a printable, one-page **Motion Observation Report** that a person can bring to a doctor or physiotherapist. This must remain a patient-generated observation handoff, not a diagnosis, clinical gait-lab report, medical device claim, or standards certification.

## Scientific reporting basis

Use the structure of the UK and Ireland Clinical Movement Analysis Society (CMAS) 2021 standards as design guidance only. CMAS asks clinical gait reports to preserve relevant history, capture conditions, typicality, compliance, artefacts/corrections, traceable trials, units, software/version, reference data, and responsible sign-off. Our app cannot satisfy lab accreditation, clinician sign-off, calibrated 3D/kinetic data, or normative comparison, so every unavailable element must be shown as `not collected`, `not confirmed`, or `not available` rather than inferred.

Source: https://cmasuki.org/wp-content/uploads/2021/08/CMAS-Standards-2021-v15.pdf

HL7 FHIR `Observation` is a future interoperability shape, not a claim for this pass. Do not implement or claim FHIR conformance.

## Required UI

Replace the handoff outcome with a warm, legible report drawer/card:

1. Header:
   - `Motion Observation Report`
   - badge: `CMAS-informed structure · patient-generated · not a clinical gait analysis report`
   - plain sentence: `A traceable observation to support a better professional conversation.`
2. Capture record, sourced only from the real `MotionReceipt`:
   - capture status/grade
   - source kind
   - trace ID / fixture ID
   - capture duration
   - sampled frames
   - pose presence
   - walking condition: `not collected`
   - footwear/surface: `not collected`
   - typical for this person: `not confirmed`
   - professional sign-off: `not performed`
3. Observed measures:
   - existing left/right same-side event intervals, IQR spreads, paired delta, accepted/rejected event estimates, foot visibility, camera-plane knee ranges
   - preserve units and `not reported` gates exactly
4. Evidence quality and artefacts:
   - frame gaps, teleport frames, interval CVs, alternation score, reason codes
5. Interpretation boundary:
   - normative/reference comparison: `not available; no validated reference population is applied`
   - repeatability: `single capture; between-session repeatability not established`
   - existing `notEstablished` list
6. Questions for a professional: keep the existing three questions.
7. Method/provenance:
   - `@mediapipe/tasks-vision@0.10.17`
   - `pose_landmarker_full.task`
   - existing model SHA-256 from `src/live/modelProvenance.ts`
   - deterministic TypeScript receipt
8. Actions:
   - primary `Print / save report` using `window.print()`
   - secondary close
   - add print CSS so printing shows the report cleanly and hides the surrounding app/backdrop/actions

## Engineering constraints

- Pass the actual `MotionReceipt` into `HandoffDrawer`; no hard-coded metric values.
- Extend `buildHandoffViewModel` so every displayed dynamic token maps directly to receipt/display fields. Keep it pure and unit-testable.
- All new user-facing strings must live in `src/copy/copy.ts` and pass the claims lint.
- Do not use the words `approved`, `compliant`, `validated`, `diagnostic`, `normal`, `abnormal`, `risk`, `injury prediction`, or `medical report` as positive claims.
- You may say `CMAS-informed structure` only next to the explicit non-clinical disclaimer.
- Do not add dependencies, network calls, storage, patient identity fields, or FHIR claims.
- Do not edit `README.md`, `SUBMISSION_PACKET.md`, or `RECORDING_SCRIPT.md`; the manager owns those concurrently.
- Do not change measurement algorithms, gates, hero, real-video proof, or poor-capture behavior.

## Tests and verification

- Expand `tests/handoffMapping.test.ts` for all dynamic report fields.
- Add a source-level or component test proving the print action exists and no forbidden certification claim appears.
- Run `npm test`, `npm run lint:claims`, and `npm run build`.
- Update `BUILD_RECEIPT.md` and `MANIFEST.md` with this pass and observed results.

Return a concise implementation summary and exact verification output.
