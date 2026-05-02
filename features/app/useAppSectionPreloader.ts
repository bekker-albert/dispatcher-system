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

const primarySectionPreloaders = [
  () => import("@/features/app/ReportsPrimaryContent"),
  () => import("@/features/app/DispatchPrimaryContent"),
  () => import("@/features/app/AdminPrimaryContent"),
];

const ptoSectionPreloaders = [
  () => import("@/features/app/PtoPrimaryContent"),
];

export function useAppSectionPreloader(
  enabled: boolean,
  { includePto = false }: { includePto?: boolean } = {},
) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;

    const sectionPreloaders = includePto
      ? [...primarySectionPreloaders, ...ptoSectionPreloaders]
      : primarySectionPreloaders;
    let cancelled = false;
    let cancelIdlePreload: (() => void) | undefined;
    let preloadIndex = 0;

    const runNextPreload = () => {
      if (cancelled || preloadIndex >= sectionPreloaders.length) return;

      cancelIdlePreload = scheduleIdlePreload(() => {
        if (cancelled) return;

        const preloadSection = sectionPreloaders[preloadIndex];
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
  }, [enabled, includePto]);
}
