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
  { key: "dispatch", load: () => import("@/features/app/DispatchPrimaryContent") },
];

const ptoSectionPreloaders: SectionPreloader[] = [
  // PTO is intentionally not preloaded: the date tables and bucket grids are heavy.
  // Load them only when the user opens the section.
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
