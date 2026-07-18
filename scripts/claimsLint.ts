/**
 * Context-aware claims linter for Motion X-Ray.
 * Blocks seeded affirmative unsafe claims; allows explicit negation
 * and "not established" boundary language.
 *
 * Negation applies per clause, not per sentence, so mixed claims like
 * "This is not a prediction, but you have arthritis." still fail.
 */

import { copy } from '../src/copy/copy';

export type ClaimsLintResult = {
  ok: boolean;
  violations: string[];
};

const NEGATION_CUES =
  /\b(not|no|never|without|cannot|can't|does not|do not|don't|isn't|aren't|wasn't|weren't|nor)\b/i;

const BOUNDARY_PHRASES = [
  /not established/i,
  /not a prediction/i,
  /not a verdict/i,
  /not a diagnosis/i,
  /not a forecast/i,
  /not anatomy/i,
  /not a scan/i,
  /not reported/i,
  /observation to discuss/i,
  /insufficient evidence/i,
  /illustrative variant/i,
  /no auto-merge/i,
];

type PatternRule = {
  id: string;
  /** Matches affirmative/prohibited claim shapes. */
  pattern: RegExp;
};

const AFFIRMATIVE_RULES: PatternRule[] = [
  {
    id: 'diagnosis',
    pattern:
      /\b(you have|this (is|shows|confirms|indicates|proves)|diagnosed?|diagnosis of)\b.{0,40}\b(injury|arthritis|tear|degeneration|disease|condition)\b/i,
  },
  {
    id: 'prognosis',
    pattern:
      /\b(will|shall|going to)\b.{0,30}\b(injur|degenerat|worsen|fail|rupture|need surgery)\w*/i,
  },
  {
    id: 'treatment',
    pattern:
      /\b(you should|must|need to)\b.{0,40}\b(surg|inject|medicat|treat|physiotherap|physical therap)\w*/i,
  },
  {
    id: 'force',
    pattern:
      /\b(your|the patient's)\b.{0,20}\b(ground[- ]reaction force|joint moment|tissue stress|cartilage pressure|muscle (weakness|activation))\b/i,
  },
  {
    id: 'anatomy-imaging',
    pattern:
      /\b(this is|showing|reveals)\b.{0,30}\b(3d scan|x-?ray result|digital twin|biomechanical reconstruction|internal (bone|anatomy)|medical imaging)\b/i,
  },
  {
    id: 'normative-correction',
    pattern:
      /\b(corrected|ideal|normal|better|predicted)\b.{0,20}\b(gait|movement|walk|stride)\b/i,
  },
  {
    id: 'injury-probability',
    pattern:
      /\b\d+(\.\d+)?%\b.{0,20}\b(injury|degeneration)\b|\b(injury|degeneration)\b.{0,20}\bprobability\b/i,
  },
];

function isBoundaryStatement(text: string): boolean {
  return BOUNDARY_PHRASES.some((phrase) => phrase.test(text));
}

function clauseLooksNegated(clause: string): boolean {
  return NEGATION_CUES.test(clause) || isBoundaryStatement(clause);
}

/** Split sentences into clauses at but / however / semicolons / safe ", and" boundaries. */
export function splitClauses(sentence: string): string[] {
  return sentence
    .split(/\s*;\s*|\s*\bbut\b\s*|\s*\bhowever\b\s*|,\s+and\s+(?=(?:you|this|that|it|there)\b)/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function lintClaims(text: string): ClaimsLintResult {
  const violations: string[] = [];
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const clauses = splitClauses(sentence);
    for (const clause of clauses) {
      if (clauseLooksNegated(clause)) {
        continue;
      }
      for (const rule of AFFIRMATIVE_RULES) {
        if (rule.pattern.test(clause)) {
          violations.push(`${rule.id}: ${clause}`);
        }
      }
    }
  }

  return { ok: violations.length === 0, violations };
}

export const SEED_BLOCKED_CLAIMS = [
  'This confirms a diagnosis of arthritis in your knee.',
  'You will develop degeneration within ten years.',
  'You should get surgery based on this capture.',
  "Your ground-reaction force exceeds safe limits.",
  'This is a biomechanical reconstruction of your joint.',
  'This shows your corrected gait toward a normal walk.',
  'There is a 70% injury probability from this asymmetry.',
  'This is not a prediction, but you have arthritis.',
] as const;

export const SEED_ALLOWED_CLAIMS = [
  'Pain, injury, cause, tissue state, internal forces, muscle function, prognosis, or diagnosis are not established.',
  'Illustrative variant — not a prediction.',
  'Not a verdict. A measurement you can inspect.',
  'Capture closed: insufficient evidence.',
  'Computed from the selected source. A repeated camera-relative observation to discuss — not an issue, condition, or risk.',
  'No timing comparison is reported.',
  'This is not a diagnosis.',
] as const;

function collectCopyStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectCopyStrings(item, out);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectCopyStrings(nested, out);
    }
  }
}

function main(): void {
  let failed = false;
  for (const claim of SEED_BLOCKED_CLAIMS) {
    const result = lintClaims(claim);
    if (result.ok) {
      console.error(`FAIL expected block: ${claim}`);
      failed = true;
    }
  }
  for (const claim of SEED_ALLOWED_CLAIMS) {
    const result = lintClaims(claim);
    if (!result.ok) {
      console.error(`FAIL expected allow: ${claim}`);
      console.error(result.violations);
      failed = true;
    }
  }

  const copyStrings: string[] = [];
  collectCopyStrings(copy, copyStrings);
  for (const text of copyStrings) {
    const result = lintClaims(text);
    if (!result.ok) {
      console.error(`FAIL copy source: ${text}`);
      console.error(result.violations);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log(
    `claimsLint: all seeded examples passed; scanned ${copyStrings.length} centralized copy strings`,
  );
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('claimsLint.ts');

if (isDirectRun) {
  main();
}
