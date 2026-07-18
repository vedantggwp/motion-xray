import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import accepted from '../src/fixtures/accepted-walk.json';
import insufficient from '../src/fixtures/insufficient-evidence.json';
import { copy } from '../src/copy/copy';
import { validateFixture } from '../src/fixtures/schema';
import {
  MEDIAPIPE_PACKAGE,
  MEDIAPIPE_PACKAGE_VERSION,
  POSE_LANDMARKER_MODEL_ID,
  POSE_LANDMARKER_MODEL_SHA256,
} from '../src/live/modelProvenance';
import { computeReceipt, formatReceiptDisplay } from '../src/metrics/receipt';
import { buildHandoffViewModel } from '../src/ui/HandoffDrawer';

const here = dirname(fileURLToPath(import.meta.url));
const drawerSource = readFileSync(join(here, '../src/ui/HandoffDrawer.tsx'), 'utf8');
const copySource = readFileSync(join(here, '../src/copy/copy.ts'), 'utf8');
const stylesSource = readFileSync(join(here, '../src/styles.css'), 'utf8');

describe('handoff report mapping', () => {
  it('maps every dynamic report field from the MotionReceipt / display', () => {
    const receipt = computeReceipt(validateFixture(accepted));
    const display = formatReceiptDisplay(receipt);
    const handoff = buildHandoffViewModel(receipt);
    const q = receipt.quality;

    expect(handoff.grade).toBe(display.grade);
    expect(handoff.sourceKind).toBe(receipt.source);
    expect(handoff.fixtureId).toBe(receipt.fixtureId);
    expect(handoff.durationMs).toBe(`${Math.round(q.durationMs)} ms`);
    expect(handoff.sampledFrameCount).toBe(String(q.sampledFrameCount));
    expect(handoff.posePresenceRate).toBe(q.posePresenceRate.toFixed(3));
    expect(handoff.walkingCondition).toBe(copy.reportValues.notCollected);
    expect(handoff.footwearSurface).toBe(copy.reportValues.notCollected);
    expect(handoff.typicalForPerson).toBe(copy.reportValues.notConfirmed);
    expect(handoff.professionalSignOff).toBe(copy.reportValues.notPerformed);

    expect(handoff.leftMedianMs).toBe(display.leftMedianMs);
    expect(handoff.rightMedianMs).toBe(display.rightMedianMs);
    expect(handoff.deltaMs).toBe(display.deltaMs);
    expect(handoff.deltaPct).toBe(display.deltaPct);
    expect(handoff.leftSpreadMs).toBe(display.leftSpreadMs);
    expect(handoff.rightSpreadMs).toBe(display.rightSpreadMs);
    expect(handoff.footVisibilityMean).toBe(display.footVisibilityMean);
    expect(handoff.acceptedCount).toBe(display.acceptedCount);
    expect(handoff.rejectedCount).toBe(display.rejectedCount);
    expect(handoff.leftKneeRangeDeg).toBe(display.leftKneeRangeDeg);
    expect(handoff.rightKneeRangeDeg).toBe(display.rightKneeRangeDeg);

    expect(handoff.frameGaps).toBe(display.frameGaps);
    expect(handoff.teleportFrames).toBe(String(q.teleportFrameCount));
    expect(handoff.intervalCvLeft).toBe(q.intervalCvLeft.toFixed(3));
    expect(handoff.intervalCvRight).toBe(q.intervalCvRight.toFixed(3));
    expect(handoff.alternationScore).toBe(q.alternationScore.toFixed(3));
    expect(handoff.reasonCodes).toBe(
      q.reasonCodes.length > 0 ? q.reasonCodes.join(', ') : copy.measurementNone,
    );

    expect(handoff.normativeComparison).toBe(copy.reportValues.normativeComparison);
    expect(handoff.repeatability).toBe(copy.reportValues.repeatability);
    expect(handoff.notEstablished).toEqual(receipt.notEstablished);
    expect(handoff.mediapipePackage).toBe(
      `${MEDIAPIPE_PACKAGE}@${MEDIAPIPE_PACKAGE_VERSION}`,
    );
    expect(handoff.modelId).toBe(POSE_LANDMARKER_MODEL_ID);
    expect(handoff.modelSha256).toBe(POSE_LANDMARKER_MODEL_SHA256);
    expect(handoff.receiptMethod).toBe(copy.reportValues.receiptMethod);

    // No raw arithmetic leaked: formatted strings must match receipt fields only.
    expect(handoff.leftMedianMs).toMatch(/ms$/);
    expect(handoff.deltaPct).toMatch(/%$/);
    expect(handoff.leftKneeRangeDeg).toMatch(/°$/);
  });

  it('preserves not-reported gates for insufficient captures', () => {
    const receipt = computeReceipt(validateFixture(insufficient));
    const display = formatReceiptDisplay(receipt);
    const handoff = buildHandoffViewModel(receipt);

    expect(handoff.grade).toBe('insufficient');
    expect(handoff.leftMedianMs).toBe(copy.timingNotReported);
    expect(handoff.rightMedianMs).toBe(copy.timingNotReported);
    expect(handoff.deltaMs).toBe(copy.timingNotReported);
    expect(handoff.deltaPct).toBe(copy.timingNotReported);
    expect(handoff.leftSpreadMs).toBe(copy.timingNotReported);
    expect(handoff.rightSpreadMs).toBe(copy.timingNotReported);
    expect(handoff.leftKneeRangeDeg).toBe(copy.timingNotReported);
    expect(handoff.rightKneeRangeDeg).toBe(copy.timingNotReported);
    expect(handoff.leftMedianMs).toBe(display.leftMedianMs);
    expect(handoff.reasonCodes).not.toBe(copy.measurementNone);
  });

  it('exposes print action and omits forbidden certification claims', () => {
    expect(drawerSource).toMatch(/window\.print\(/);
    expect(copySource).toMatch(/Print \/ save report/);
    expect(copySource).toMatch(/Motion Observation Report/);
    expect(copySource).toMatch(
      /CMAS-informed structure · patient-generated · not a clinical gait analysis report/,
    );
    expect(stylesSource).toMatch(/@media print/);
    expect(stylesSource).toMatch(/handoff-no-print/);

    const combined = `${drawerSource}\n${copySource}`;
    expect(combined).not.toMatch(/\bFHIR\b/);
    expect(combined).not.toMatch(/\bmedical report\b/i);
    expect(combined).not.toMatch(/\bCMAS[- ]?(approved|compliant|certified)\b/i);
    expect(combined).not.toMatch(/\b(diagnostic|injury prediction)\b/i);
    expect(combined).not.toMatch(/\b(normal|abnormal)\b/i);
    // "validated" may appear only inside the explicit unavailability boundary.
    const validatedMatches = combined.match(/validated/gi) ?? [];
    expect(validatedMatches.length).toBe(1);
    expect(copy.reportValues.normativeComparison).toMatch(/no validated reference population/);
  });
});
