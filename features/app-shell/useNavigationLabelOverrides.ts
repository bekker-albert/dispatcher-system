"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  navigationLabelOverrideStorageKey,
  normalizeNavigationLabelOverride,
  parseNavigationLabelOverrides,
  type NavigationLabelOverrides,
} from "./navigationLabelOverrides";

const navigationLabelOverrideChangeEventName = "aam.dispatch.navigationLabels.changed";

function getNavigationLabelOverrideSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(navigationLabelOverrideStorageKey) ?? "";
}

function subscribeNavigationLabelOverrides(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === navigationLabelOverrideStorageKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(navigationLabelOverrideChangeEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(navigationLabelOverrideChangeEventName, callback);
  };
}

function readNavigationLabelOverrides() {
  return parseNavigationLabelOverrides(getNavigationLabelOverrideSnapshot());
}

function writeNavigationLabelOverrides(overrides: NavigationLabelOverrides) {
  if (typeof window === "undefined") return;

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(navigationLabelOverrideStorageKey);
    window.dispatchEvent(new Event(navigationLabelOverrideChangeEventName));
    return;
  }

  window.localStorage.setItem(navigationLabelOverrideStorageKey, JSON.stringify(overrides));
  window.dispatchEvent(new Event(navigationLabelOverrideChangeEventName));
}

export function useNavigationLabelOverrides() {
  const snapshot = useSyncExternalStore(
    subscribeNavigationLabelOverrides,
    getNavigationLabelOverrideSnapshot,
    () => "",
  );
  const overrides = useMemo(() => parseNavigationLabelOverrides(snapshot), [snapshot]);

  const setLabelOverride = useCallback((id: string, value: string, defaultLabel: string) => {
    const normalized = normalizeNavigationLabelOverride(value, defaultLabel);
    const next = { ...readNavigationLabelOverrides() };

    if (normalized) {
      next[id] = normalized;
    } else {
      delete next[id];
    }

    writeNavigationLabelOverrides(next);
  }, []);

  const resetLabelOverride = useCallback((id: string) => {
    const next = { ...readNavigationLabelOverrides() };
    delete next[id];
    writeNavigationLabelOverrides(next);
  }, []);

  const resetAllLabelOverrides = useCallback(() => {
    writeNavigationLabelOverrides({});
  }, []);

  return {
    overrides,
    setLabelOverride,
    resetLabelOverride,
    resetAllLabelOverrides,
  };
}
