import type { MotionFrame } from '../fixtures/schema';

export type ProbeResult = 'available' | 'unavailable';

export interface MotionSource {
  probe(): Promise<ProbeResult>;
  start(): AsyncIterable<MotionFrame>;
  stop(): void;
}

export type LiveStatus =
  | { kind: 'idle' }
  | { kind: 'probing' }
  | { kind: 'model-loading'; progress: number; detail: string }
  | { kind: 'preview'; stream: MediaStream }
  | { kind: 'framing' }
  | { kind: 'countdown'; remainingMs: number }
  | { kind: 'capturing'; elapsedMs: number; frameCount: number }
  | { kind: 'processing'; progress: number; frameCount: number }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'cancelled' }
  | { kind: 'ready' };
