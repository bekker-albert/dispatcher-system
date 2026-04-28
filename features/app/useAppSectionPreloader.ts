"use client";

import { useEffect } from "react";

type IdleCallbackHandle = number;
type BrowserIdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function scheduleIdlePreload(callback: () => void) {
  const browserWindow = window as BrowserIdleWindow;

  if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
    const handle = browserWindow.requestIdleCallback(callback, { timeout: 2500 });
    return () => browserWindow.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(handle);
}

const coreSectionPreloaders = [
  () => import("@/features/app/ReportsPrimaryContent"),
  () => import("@/features/app/DispatchPrimaryContent"),
  () => import("@/features/app/AdminPrimaryContent"),
  () => import("@/features/app/PtoPrimaryContent"),
];

export function useAppSectionPreloader(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;

    let cancelled = false;
    let cancelIdlePreload: (() => void) | undefined;
    let preloadIndex = 0;

    const runNextPreload = () => {
      if (cancelled || preloadIndex >= coreSectionPreloaders.length) return;

      cancelIdlePreload = scheduleIdlePreload(() => {
        if (cancelled) return;

        const preloadSection = coreSectionPreloaders[preloadIndex];
        preloadIndex += 1;
        if (!preloadSection) return;

        void preloadSection().finally(() => {
          runNextPreload();
        });
      });
    };

    runNextPreload();

    return () => {
      cancelled = true;
      cancelIdlePreload?.();
    };
  }, [enabled]);
}
