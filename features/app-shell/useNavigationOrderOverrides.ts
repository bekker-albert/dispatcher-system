"use client";

import { useCallback, useState } from "react";

import {
  moveNavigationItemWithinParent,
  navigationOrderOverrideStorageKey,
  parseNavigationOrderOverrides,
  type NavigationOrderOverrides,
} from "./navigationOrderOverrides";

function readNavigationOrderOverrides() {
  if (typeof window === "undefined") return {};
  return parseNavigationOrderOverrides(window.localStorage.getItem(navigationOrderOverrideStorageKey));
}

function writeNavigationOrderOverrides(overrides: NavigationOrderOverrides) {
  if (typeof window === "undefined") return;

  if (Object.keys(overrides).length === 0) {
    window.localStorage.removeItem(navigationOrderOverrideStorageKey);
    return;
  }

  window.localStorage.setItem(navigationOrderOverrideStorageKey, JSON.stringify(overrides));
}

function orderMatchesDefault(nextIds: string[], defaultIds: string[]) {
  return nextIds.length === defaultIds.length && nextIds.every((id, index) => id === defaultIds[index]);
}

export function useNavigationOrderOverrides() {
  const [overrides, setOverrides] = useState<NavigationOrderOverrides>(() => readNavigationOrderOverrides());

  const moveItem = useCallback((parentId: string, draggedId: string, targetId: string, defaultIds: string[]) => {
    setOverrides((current) => {
      const baseIds = current[parentId] ?? defaultIds;
      const nextIds = moveNavigationItemWithinParent(baseIds, draggedId, targetId);
      const next = { ...current };

      if (orderMatchesDefault(nextIds, defaultIds)) {
        delete next[parentId];
      } else {
        next[parentId] = nextIds;
      }

      writeNavigationOrderOverrides(next);
      return next;
    });
  }, []);

  const resetParentOrder = useCallback((parentId: string) => {
    setOverrides((current) => {
      const next = { ...current };
      delete next[parentId];
      writeNavigationOrderOverrides(next);
      return next;
    });
  }, []);

  const resetAllOrderOverrides = useCallback(() => {
    setOverrides({});
    writeNavigationOrderOverrides({});
  }, []);

  return {
    overrides,
    moveItem,
    resetParentOrder,
    resetAllOrderOverrides,
  };
}
