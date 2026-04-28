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

function preloadCoreSections() {
  void import("@/features/app/AdminPrimaryContent");
  void import("@/features/app/DispatchPrimaryContent");
  void import("@/features/app/PtoPrimaryContent");
  void import("@/features/app/ReportsPrimaryContent");
}

export function useAppSectionPreloader(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;

    return scheduleIdlePreload(() => {
      preloadCoreSections();
    });
  }, [enabled]);
}
