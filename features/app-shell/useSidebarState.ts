"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

export const sidebarCollapsedPreferenceKey = "dispatcher.erpShell.sidebarCollapsed";
const sidebarCollapsedPreferenceChangeEventName = "dispatcher.erpShell.sidebarCollapsed.changed";

function getSidebarCollapsedSnapshot() {
  if (typeof window === "undefined") return "false";
  try {
    return window.localStorage.getItem(sidebarCollapsedPreferenceKey) === "true" ? "true" : "false";
  } catch {
    return "false";
  }
}

function subscribeSidebarCollapsedPreference(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === sidebarCollapsedPreferenceKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(sidebarCollapsedPreferenceChangeEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(sidebarCollapsedPreferenceChangeEventName, callback);
  };
}

function writeSidebarCollapsedPreference(nextValue: boolean) {
  try {
    window.localStorage.setItem(sidebarCollapsedPreferenceKey, String(nextValue));
    window.dispatchEvent(new Event(sidebarCollapsedPreferenceChangeEventName));
  } catch {
    // UI preference persistence can fail in restricted browsing modes.
  }
}

export function useSidebarState() {
  const collapsedSnapshot = useSyncExternalStore(
    subscribeSidebarCollapsedPreference,
    getSidebarCollapsedSnapshot,
    () => "false",
  );
  const collapsed = collapsedSnapshot === "true";
  const [mobileOpen, setMobileOpen] = useState(false);

  const setCollapsedPreference = useCallback((nextValue: boolean) => {
    writeSidebarCollapsedPreference(nextValue);
  }, []);

  const toggleCollapsed = useCallback(() => {
    writeSidebarCollapsedPreference(!collapsed);
  }, [collapsed]);

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
