"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const sidebarGroupExpansionPreferenceKey = "dispatcher.erpShell.sidebarGroups.v1";
const sidebarGroupExpansionChangeEventName = "dispatcher.erpShell.sidebarGroups.changed";

type SidebarGroupExpansionPreferences = Record<string, boolean>;

function getSidebarGroupExpansionSnapshot() {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(sidebarGroupExpansionPreferenceKey) ?? "";
  } catch {
    return "";
  }
}

function parseSidebarGroupExpansionPreferences(value: string): SidebarGroupExpansionPreferences {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => (
        typeof entry[0] === "string" && typeof entry[1] === "boolean"
      )),
    );
  } catch {
    return {};
  }
}

function subscribeSidebarGroupExpansion(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === sidebarGroupExpansionPreferenceKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(sidebarGroupExpansionChangeEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(sidebarGroupExpansionChangeEventName, callback);
  };
}

function writeSidebarGroupExpansionPreferences(preferences: SidebarGroupExpansionPreferences) {
  if (typeof window === "undefined") return;

  try {
    if (Object.keys(preferences).length === 0) {
      window.localStorage.removeItem(sidebarGroupExpansionPreferenceKey);
    } else {
      window.localStorage.setItem(sidebarGroupExpansionPreferenceKey, JSON.stringify(preferences));
    }
    window.dispatchEvent(new Event(sidebarGroupExpansionChangeEventName));
  } catch {
    // Sidebar expansion is a UI preference and can safely fall back to defaults.
  }
}

function readSidebarGroupExpansionPreferences() {
  return parseSidebarGroupExpansionPreferences(getSidebarGroupExpansionSnapshot());
}

export function useSidebarGroupExpansion(groupId: string, defaultExpanded: boolean) {
  const snapshot = useSyncExternalStore(
    subscribeSidebarGroupExpansion,
    getSidebarGroupExpansionSnapshot,
    () => "",
  );
  const preferences = useMemo(() => parseSidebarGroupExpansionPreferences(snapshot), [snapshot]);
  const expanded = preferences[groupId] ?? defaultExpanded;

  const setExpanded = useCallback((nextExpanded: boolean) => {
    const next = { ...readSidebarGroupExpansionPreferences() };

    if (nextExpanded === defaultExpanded) {
      delete next[groupId];
    } else {
      next[groupId] = nextExpanded;
    }

    writeSidebarGroupExpansionPreferences(next);
  }, [defaultExpanded, groupId]);

  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  return {
    expanded,
    setExpanded,
    toggleExpanded,
  };
}
