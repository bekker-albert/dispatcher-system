"use client";

import { useCallback, useState } from "react";

export const sidebarCollapsedPreferenceKey = "dispatcher.erpShell.sidebarCollapsed";

function readInitialSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(sidebarCollapsedPreferenceKey) === "true";
  } catch {
    return false;
  }
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(readInitialSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsedPreference = useCallback((nextValue: boolean) => {
    setCollapsed(nextValue);
    try {
      window.localStorage.setItem(sidebarCollapsedPreferenceKey, String(nextValue));
    } catch {
      // UI preference persistence can fail in restricted browsing modes.
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const nextValue = !current;
      try {
        window.localStorage.setItem(sidebarCollapsedPreferenceKey, String(nextValue));
      } catch {
        // UI preference persistence can fail in restricted browsing modes.
      }
      return nextValue;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return {
    collapsed,
    mobileOpen,
    setCollapsedPreference,
    toggleCollapsed,
    openMobile,
    closeMobile,
  };
}
