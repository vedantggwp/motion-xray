/// <reference types="vite/client" />

import type { MotionXrayDebugHandle } from './app/motionXrayDebug';

declare global {
  interface Window {
    /** Present only in development builds — never ship personal capture fixtures. */
    __MOTION_XRAY_DEBUG__?: MotionXrayDebugHandle;
  }
}

export {};
