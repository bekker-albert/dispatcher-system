"use client";

import { useCallback, useState } from "react";

import {
  navigationLabelOverrideStorageKey,
  normalizeNavigationLabelOverride,
  parseNavigationLabelOverrides,
  type NavigationLabelOverrides,
} from "./navigationLabelOverrides";

function readNavigationLabelOverrides() {
  if (typeof window === "undefined") return {};
  return parseNavigationLabelOverrides(window.localStorage.getItem(navigationLabelOverrideStorageKey));
}

function writeNavigationLabelOverrides(overrides: NavigationLabelOverrides) {
  if (typeof window === "undefined") return;

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(navigationLabelOverrideStorageKey);
    return;
  }

  window.localStorage.setItem(navigationLabelOverrideStorageKey, JSON.stringify(overrides));
}

export function useNavigationLabelOverrides() {
  const [overrides, setOverrides] = useState<NavigationLabelOverrides>(() => readNavigationLabelOverrides());

  const setLabelOverride = useCallback((id: string, value: string, defaultLabel: string) => {
    setOverrides((current) => {
      const normalized = normalizeNavigationLabelOverride(value, defaultLabel);
      const next = { ...current };

      if (normalized) {
        next[id] = normalized;
      } else {
        delete next[id];
      }

      writeNavigationLabelOverrides(next);
      return next;
    });
  }, []);

  const resetLabelOverride = useCallback((id: string) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[id];
      writeNavigationLabelOverrides(next);
      return next;
    });
  }, []);

  const resetAllLabelOverrides = useCallback(() => {
    setOverrides({});
    writeNavigationLabelOverrides({});
  }, []);

  return {
    overrides,
    setLabelOverride,
    resetLabelOverride,
    resetAllLabelOverrides,
  };
}
