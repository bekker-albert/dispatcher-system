"use client";

import { startTransition, useCallback } from "react";
import type { TopTab } from "@/lib/domain/navigation/tabs";

type NavigationSelectionHandlersOptions = {
  setTopTab: (tab: TopTab) => void;
  setPtoTab: (tab: string) => void;
  setPtoPlanYear: (year: string) => void;
  setPtoAreaFilter: (area: string) => void;
};

export function useNavigationSelectionHandlers({
  setTopTab,
  setPtoTab,
  setPtoPlanYear,
  setPtoAreaFilter,
}: NavigationSelectionHandlersOptions) {
  const selectTopTab = useCallback((tab: TopTab) => {
    setTopTab(tab);
  }, [setTopTab]);

  const selectPtoTab = useCallback((tab: string) => {
    startTransition(() => {
      setPtoTab(tab);
    });
  }, [setPtoTab]);

  const selectPtoPlanYear = useCallback((year: string) => {
    setPtoPlanYear(year);
  }, [setPtoPlanYear]);

  const selectPtoArea = useCallback((area: string) => {
    setPtoAreaFilter(area);
  }, [setPtoAreaFilter]);

  return {
    selectTopTab,
    selectPtoTab,
    selectPtoPlanYear,
    selectPtoArea,
  };
}
