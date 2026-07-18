export const copy = {
  productName: 'Motion X-Ray',
  heroHeadline: 'Your body just opened a pull request.',
  heroBody:
    'Motion X-Ray turns a short walking capture into a 3D landmark visualisation you can replay, inspect, and take to a professional. Not a verdict. A measurement you can inspect.',
  heroHelper:
    'Run real video proof analyses a bundled same-origin walk through MediaPipe. Bundled replay stays the offline synthetic fallback.',
  trustLine: 'Not a verdict. A measurement you can inspect.',
  safetyLine: 'No auto-merge into diagnosis.',
  bodyDiffLabel: 'BODY DIFF · Motion X-Ray view',
  bodyDiffFooter:
    'Computed from the selected source. A repeated camera-relative observation to discuss — not an issue, condition, or risk.',
  forkLabel: 'Illustrative Fork',
  forkParameterLabel: 'Right-side phase offset toward left median',
  forkDisclaimer:
    'Illustrative variant — not a prediction. The animation changes one stated display parameter; it does not estimate pain, injury, treatment response, or your future.',
  reportTitle: 'Motion Observation Report',
  reportBadge:
    'CMAS-informed structure · patient-generated · not a clinical gait analysis report',
  reportIntro: 'A traceable observation to support a better professional conversation.',
  reportSections: {
    captureRecord: 'Capture record',
    observedMeasures: 'Observed measures',
    evidenceQuality: 'Evidence quality and artefacts',
    interpretationBoundary: 'Interpretation boundary',
    questions: 'Questions for a professional',
    methodProvenance: 'Method / provenance',
  },
  reportFields: {
    captureStatus: 'Capture status',
    walkingCondition: 'Walking condition',
    footwearSurface: 'Footwear / surface',
    typicalForPerson: 'Typical for this person',
    professionalSignOff: 'Professional sign-off',
    traceId: 'Trace ID / fixture ID',
    leftMedian: 'Left median same-side event interval',
    rightMedian: 'Right median same-side event interval',
    pairedDelta: 'Paired timing delta',
    leftSpread: 'Left spread (IQR)',
    rightSpread: 'Right spread (IQR)',
    leftKneeRange: 'Left knee flexion range (camera-plane estimate)',
    rightKneeRange: 'Right knee flexion range (camera-plane estimate)',
    acceptedEstimates: 'Accepted heel-low event estimates',
    rejectedEstimates: 'Rejected heel-low event estimates',
    normativeComparison: 'Normative / reference comparison',
    repeatability: 'Repeatability',
    notEstablishedHeading: 'Not established',
    mediapipePackage: 'MediaPipe package',
    modelIdentity: 'Pose Landmarker model',
    modelSha256: 'Model SHA-256',
    receiptMethod: 'Receipt method',
  },
  reportValues: {
    notCollected: 'not collected',
    notConfirmed: 'not confirmed',
    notPerformed: 'not performed',
    normativeComparison:
      'not available; no validated reference population is applied',
    repeatability:
      'single capture; between-session repeatability not established',
    receiptMethod: 'Deterministic TypeScript receipt',
  },
  handoffQuestions: [
    'This capture shows a repeated left/right step-timing difference. What would you look at to understand it in my context?',
    'How repeatable, over how many captures, would a difference like this need to be before it becomes meaningful?',
    'What history or additional observations would make this measurement more useful to you?',
  ] as const,
  notEstablished:
    'Pain, injury, cause, tissue state, internal forces, muscle function, prognosis, or diagnosis.',
  notEstablishedList: [
    'Pain',
    'Injury',
    'Cause',
    'Tissue state',
    'Internal forces',
    'Muscle function',
    'Prognosis',
    'Diagnosis',
  ] as const,
  abstentionTitle: 'Capture closed: insufficient evidence.',
  abstentionBody:
    'Capture-protocol gates closed this analysis. No timing comparison is reported.',
  abstentionHint:
    'This is a result about the capture, not about your body. Try a stable side-on view with both feet fully in frame for about ten seconds.',
  actions: {
    runRealVideoProof: 'Run real video proof',
    runBundled: 'Run the bundled replay',
    liveCamera: 'Use live camera',
    localVideo: 'Analyse a local video',
    poorCapture: 'View the poor-capture demo',
    openSources: 'Choose a source',
    openHandoff: 'Open motion observation report',
    closeHandoff: 'Close',
    printReport: 'Print / save report',
    backToHero: 'Back to landing',
    startCapture: 'Start capture',
    cancelCapture: 'Cancel capture',
    chooseFile: 'Choose video file',
    downloadReceiptJson: 'Download receipt JSON',
    downloadDevFixture: 'Download fixture (dev only)',
  },
  measurementReceiptTitle: 'Measurement receipt',
  measurementReceiptNote:
    'Capture evidence for inspection. Candidate and accepted counts are heel-low event estimates — not heel strikes, diagnosis, or clinical grade.',
  measurementNone: 'none',
  captureGate: 'Capture gate',
  sourceKind: 'Source kind',
  fixtureIdLabel: 'Fixture ID',
  sampledFrameCount: 'Sampled frames',
  durationMs: 'Capture duration',
  posePresenceRate: 'Pose presence rate',
  frameGaps: 'Frame gaps',
  teleportFrames: 'Teleport frames',
  candidateHeelLowLeft: 'Candidate heel-low events (left)',
  candidateHeelLowRight: 'Candidate heel-low events (right)',
  acceptedHeelLowLeft: 'Accepted heel-low event estimates (left)',
  acceptedHeelLowRight: 'Accepted heel-low event estimates (right)',
  rejectedLowVisibilityLeft: 'Rejected · low-visibility (left)',
  rejectedLowVisibilityRight: 'Rejected · low-visibility (right)',
  rejectedDiscontinuityLeft: 'Rejected · discontinuity (left)',
  rejectedDiscontinuityRight: 'Rejected · discontinuity (right)',
  intervalCvLeft: 'Interval CV (left)',
  intervalCvRight: 'Interval CV (right)',
  alternationScore: 'Alternation score',
  mediapipePackage: 'MediaPipe package',
  modelIdentity: 'Pose Landmarker model',
  modelSha256: 'Model SHA-256',
  evidenceClasses: {
    recorded: {
      id: 'recorded' as const,
      label: 'Source data',
      description:
        'Source pixels or synthetic fixture frames. Camera/video stays in this browser — not anatomy.',
    },
    estimated: {
      id: 'estimated' as const,
      label: 'Estimated',
      description:
        'Model-estimated landmarks from MediaPipe Pose Landmarker (normalized and hip-origin world metres).',
    },
    calculated: {
      id: 'calculated' as const,
      label: 'Calculated',
      description:
        'Deterministic TypeScript receipt fields over landmarks — timing and camera-plane estimates.',
    },
    illustrative: {
      id: 'illustrative' as const,
      label: 'Illustrative',
      description:
        'A parameterised animation fork. Never called corrected, better, ideal, or predicted.',
    },
    research: {
      id: 'research' as const,
      label: 'Research reference',
      description:
        'Detached population-level context. Never mapped onto this person as a personalised claim.',
    },
    unavailable: {
      id: 'unavailable' as const,
      label: 'Unavailable',
      description:
        'Forces, tissue stress, personalised anatomy, diagnosis, and future outcomes are not computed.',
    },
  },
  timingNotReported: 'not reported',
  kneeFlexionLabel: 'Knee flexion range (camera-plane estimate)',
  liveUnavailable:
    'Live camera unavailable in this browser session. The bundled replay remains intact.',
  liveProbing: 'Checking camera availability…',
  livePreview: 'Local camera preview — frames stay in this browser. No upload.',
  modelLoading: 'Loading local Pose Landmarker model and WASM…',
  captureProtocolTitle: 'Capture protocol',
  provenanceFixture: 'Source: bundled synthetic fixture · offline · deterministic',
  provenanceLive:
    'local video pixels → MediaPipe Pose Landmarker → deterministic TypeScript receipt → 3D evidence replay',
  provenanceLocalVideo:
    'local video pixels → MediaPipe Pose Landmarker → deterministic TypeScript receipt → 3D evidence replay',
  breakthroughTitle: 'Built from existing breakthroughs',
  breakthroughBody:
    'This demo composes MediaPipe Pose Landmarker, Sports2D capture discipline, and research paths such as Pose2Sim and OpenCap. Composition is the story — not invention, and not inherited clinical validation.',
  breakthroughLinks: [
    {
      label: 'MediaPipe Pose Landmarker',
      href: 'https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js',
    },
    {
      label: 'Sports2D',
      href: 'https://github.com/davidpagnon/Sports2D',
    },
    {
      label: 'Pose2Sim',
      href: 'https://github.com/perfanalytics/pose2sim',
    },
    {
      label: 'OpenCap',
      href: 'https://github.com/opencap-org/opencap-core',
    },
  ] as const,
  worldLandmarksNote:
    'World landmarks are MediaPipe hip-origin estimates in metres — centred for display, not a personalised anatomical model.',
  resolvingLabel: 'Resolving landmark evidence…',
  processingLabel: 'Processing captured landmarks…',
  eventRibbonLabel: 'Accepted heel-low event estimates',
  scrubberLabel: 'Replay playhead',
  leftLabel: 'Left',
  rightLabel: 'Right',
  medianInterval: 'Median same-side event interval',
  spread: 'Spread (IQR)',
  delta: 'Paired timing delta',
  quality: 'Capture quality',
  acceptedEvents: 'Accepted heel-low events',
  rejectedEvents: 'Rejected heel-low events',
  footVisibility: 'Mean foot visibility',
  reasonCodes: 'Abstention reason codes',
  evidenceLensLabel: 'Evidence Lens',
  textSummaryLabel: 'Accessible motion summary',
  fixtureError: 'Fixture could not be loaded. Check schema and try again.',
  captureCancelled: 'Capture cancelled. The bundled synthetic replay remains available.',
} as const;

export type Copy = typeof copy;
