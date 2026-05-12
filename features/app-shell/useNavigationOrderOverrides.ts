"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  moveNavigationItemWithinParent,
  navigationOrderOverrideStorageKey,
  parseNavigationOrderOverrides,
  type NavigationOrderOverrides,
} from "./navigationOrderOverrides";

const navigationOrderOverrideChangeEventName = "aam.dispatch.navigationOrder.changed";

function getNavigationOrderOverrideSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(navigationOrderOverrideStorageKey) ?? "";
}

function subscribeNavigationOrderOverrides(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === navigationOrderOverrideStorageKey) callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(navigationOrderOverrideChangeEventName, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(navigationOrderOverrideChangeEventName, callback);
  };
}

function readNavigationOrderOverrides() {
  return parseNavigationOrderOverrides(getNavigationOrderOverrideSnapshot());
}

function writeNavigationOrderOverrides(overrides: NavigationOrderOverrides) {
  if (typeof window === "undefined") return;

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(navigationOrderOverrideStorageKey);
    window.dispatchEvent(new Event(navigationOrderOverrideChangeEventName));
    return;
  }

  window.localStorage.setItem(navigationOrderOverrideStorageKey, JSON.stringify(overrides));
  window.dispatchEvent(new Event(navigationOrderOverrideChangeEventName));
}

function orderMatchesDefault(nextIds: string[], defaultIds: string[]) {
  return nextIds.length === defaultIds.length && nextIds.every((id, index) => id === defaultIds[index]);
}

export function useNavigationOrderOverrides() {
  const snapshot = useSyncExternalStore(
    subscribeNavigationOrderOverrides,
    getNavigationOrderOverrideSnapshot,
    () => "",
  );
  const overrides = useMemo(() => parseNavigationOrderOverrides(snapshot), [snapshot]);

  const moveItem = useCallback((parentId: string, draggedId: string, targetId: string, defaultIds: string[]) => {
    const current = readNavigationOrderOverrides();
    const baseIds = current[parentId] ?? defaultIds;
    const nextIds = moveNavigationItemWithinParent(baseIds, draggedId, targetId);
    const next = { ...current };

    if (orderMatchesDefault(nextIds, defaultIds)) {
      delete next[parentId];
    } else {
      next[parentId] = nextIds;
    }

    writeNavigationOrderOverrides(next);
  }, []);

  const resetParentOrder = useCallback((parentId: string) => {
    const next = { ...readNavigationOrderOverrides() };
    delete next[parentId];
    writeNavigationOrderOverrides(next);
  }, []);

  const resetAllOrderOverrides = useCallback(() => {
    writeNavigationOrderOverrides({});
  }, []);

  return {
    overrides,
    moveItem,
    resetParentOrder,
    resetAllOrderOverrides,
  };
}
