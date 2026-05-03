"use client";

import { useEffect } from "react";

type IdleCallbackHandle = number;
type BrowserIdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};
type SectionPreloader = {
  key: string;
  load: () => Promise<unknown>;
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

const completedPreloaders = new Set<string>();

const primarySectionPreloaders: SectionPreloader[] = [
  { key: "reports", load: () => import("@/features/app/ReportsPrimaryContent") },
  { key: "dispatch", load: () => import("@/features/app/DispatchPrimaryContent") },
  { key: "admin", load: () => import("@/features/app/AdminPrimaryContent") },
];

const ptoSectionPreloaders: SectionPreloader[] = [
  { key: "pto", load: () => import("@/features/app/PtoPrimaryContent") },
];

export function useAppSectionPreloader(
  enabled: boolean,
  { activeTab = "", includePto = false }: { activeTab?: string; includePto?: boolean } = {},
) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof window === "undefined") return undefined;

    const sectionPreloaders = (includePto
      ? [...primarySectionPreloaders, ...ptoSectionPreloaders]
      : primarySectionPreloaders
    ).filter((preloader) => preloader.key !== activeTab);
    let cancelled = false;
    let cancelIdlePreload: (() => void) | undefined;
    let preloadIndex = 0;

    const runNextPreload = () => {
      while (preloadIndex < sectionPreloaders.length && completedPreloaders.has(sectionPreloaders[preloadIndex]?.key ?? "")) {
        preloadIndex += 1;
      }
      if (cancelled || preloadIndex >= sectionPreloaders.length) return;

      cancelIdlePreload = scheduleIdlePreload(() => {
        if (cancelled) return;

        const preloadSection = sectionPreloaders[preloadIndex];
        preloadIndex += 1;
        if (!preloadSection) return;

        void preloadSection.load().finally(() => {
          completedPreloaders.add(preloadSection.key);
          runNextPreload();
        });
      });
    };

    runNextPreload();

    return () => {
      cancelled = true;
      cancelIdlePreload?.();
    };
  }, [activeTab, enabled, includePto]);
}
