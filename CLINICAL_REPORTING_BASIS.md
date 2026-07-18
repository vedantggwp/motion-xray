# Clinical reporting basis for Motion X-Ray

Date: 2026-07-18

## Decision

There is no universal, professionally accepted certification for a patient-generated monocular phone-video gait card. Motion X-Ray therefore does not label its output clinically approved, validated, diagnostic, or standards compliant.

The defensible outcome is a **Motion Observation Report** whose structure is informed by established clinical movement-analysis reporting practice. It is a traceable patient-generated observation that makes missing clinical context explicit and supports a professional conversation.

## Primary sources

| Source | What it supports | Confidence |
|---|---|---|
| [Clinical Movement Analysis Society Standards, version 15, 2021](https://cmasuki.org/wp-content/uploads/2021/08/CMAS-Standards-2021-v15.pdf) | Reporting should preserve clinical history, consistency, capture conditions, cooperation, typicality, problems and artefacts, corrections, units, trial traceability, processing software and versions, reference data, and accountable sign-off. It also requires protocols and clear reasons for excluding trials. | High |
| [HL7 FHIR R4 Observation](https://hl7.org/fhir/R4/observation.html) | Healthcare systems distinguish point-in-time observations from diagnoses. A DiagnosticReport can provide context for a set of atomic Observations. This is an interoperability direction, not current Motion X-Ray conformance. | High |
| [Brunnekreef et al., BMC Musculoskeletal Disorders, 2005](https://doi.org/10.1186/1471-2474-6-17) | Structured videotaped observational gait analysis was only moderately reliable; expert raters performed better. This supports a structured handoff and professional interpretation, not automated conclusions. | Moderate |
| [GAMMA recommendations for standardising clinical movement-analysis laboratories, 2024](https://doi.org/10.1016/j.gaitpost.2024.11.018) | Clinical movement analysis depends on documented protocols, quality assurance, technical competence, repeatability, and laboratory governance. | Moderate |

Practitioner forums and social sources were intentionally excluded from this medical reporting decision because primary standards and peer-reviewed evidence are the appropriate authority.

## Report mapping

| Clinical reporting concern | Motion X-Ray field | Honest boundary |
|---|---|---|
| Trial traceability | Trace ID, source kind, capture duration, sampled frames | No patient identity is collected |
| Capture conditions | Walking condition, footwear and surface | Shown as `not collected` until the user supplies them |
| Typicality and cooperation | Typical for this person | Shown as `not confirmed` |
| Evidence quality and artefacts | Pose presence, foot visibility, frame gaps, teleport frames, rejected events, interval CV, alternation | These are capture-protocol checks, not health grades |
| Observed values with units | Same-side event intervals, IQR, paired delta, camera-plane knee ranges | No normal or abnormal label |
| Reference comparison | Normative or reference comparison | Shown as unavailable because no validated reference population is applied |
| Repeatability | Repeatability field | Single capture; between-session repeatability not established |
| Processing provenance | Package, model identity, model checksum, deterministic receipt method | Provenance does not establish clinical validity |
| Responsible interpretation | Professional sign-off and questions | Sign-off shown as not performed; interpretation remains with a professional |

## What would be required for a clinical claim

1. Freeze a repeatable capture protocol, including camera geometry, distance calibration, clothing, footwear, surface, speed condition, and multiple trials.
2. Define each measure against a reference method and pre-register acceptance thresholds.
3. Validate event timing against force plates or an accepted gait-lab system.
4. Validate kinematics against calibrated 3D motion capture, with error and agreement reported by joint, plane, and population.
5. Establish within-session, between-session, operator, device, and environment repeatability using appropriate error statistics and confidence intervals.
6. Build or license an appropriate reference dataset before any normative comparison.
7. Conduct clinician usability studies and patient-safety review.
8. Complete privacy, security, quality-management, and applicable medical-device regulatory work.
9. Define and validate an HL7 FHIR profile only if clinical system interoperability becomes a product requirement.

Until those steps are complete, Motion X-Ray should remain what the interface says it is: not a verdict, but a measurement that can be inspected.
