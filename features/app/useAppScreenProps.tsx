"use client";

import type { ComponentProps } from "react";
import { useCallback } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppHeaderProps } from "@/features/app/useAppHeaderProps";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
type AppNavigation = ReturnType<typeof useAppActiveNavigation>;

type UseAppScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};

type UseAppScreenPropsResult = {
  appHeaderProps: ComponentProps<typeof AppHeader>;
  primaryContentProps: ComponentProps<typeof AppPrimaryContent>;
};

export function useAppScreenProps({
  appState,
  models,
  runtime,
  navigation,
}: UseAppScreenPropsArgs): UseAppScreenPropsResult {
  const {
    topTab,
    topTabs,
    subTabs,
    customTabs,
    deleteCustomTab,
    dispatchTab,
    setDispatchTab,
    ptoTab,
    adminSection,
    setAdminSection,
    reportCustomerId,
    setReportCustomerId,
    reportCustomers,
    reportDate,
    selectReportDate,
    selectTopTab,
    selectPtoTab,
  } = appState;

  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerHasSubtabs,
    headerSubtabsOffset,
  } = navigation;

  const guardedSelectTopTab = useCallback((tab: typeof topTab) => {
    if (tab === topTab) return;
    selectTopTab(tab);
    void runtime.flushPtoDatabasePendingSave();
  }, [runtime, selectTopTab, topTab]);

  const guardedSelectPtoTab = useCallback((tab: string) => {
    if (tab === ptoTab) return;
    selectPtoTab(tab);
  }, [selectPtoTab, ptoTab]);

  const appHeaderProps = useAppHeaderProps({
    topTabs,
    customTabs,
    topTab,
    subTabs,
    headerHasSubtabs,
    headerSubtabsOffset,
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    reportCustomers,
    reportCustomerId,
    dispatchTab,
    ptoTab,
    adminSection,
    reportDate,
    selectTopTab: guardedSelectTopTab,
    deleteCustomTab,
    setReportCustomerId,
    setDispatchTab,
    selectPtoTab: guardedSelectPtoTab,
    setAdminSection,
    selectReportDate,
  });

  return {
    appHeaderProps,
    primaryContentProps: {
      appState,
      models,
      runtime,
      navigation,
    },
  };
}
