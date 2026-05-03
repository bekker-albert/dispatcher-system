"use client";

import type { ComponentProps } from "react";
import { useCallback, useEffect } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppHeaderProps } from "@/features/app/useAppHeaderProps";
import type { AppScreenPropsArgs } from "@/features/app/appScreenPropsTypes";
import {
  appNavigationEventName,
  isAppNavigationEvent,
} from "@/lib/domain/navigation/appNavigationEvents";

type UseAppScreenPropsResult = {
  appHeaderProps: ComponentProps<typeof AppHeader>;
  primaryContentProps: ComponentProps<typeof AppPrimaryContent>;
};

export function useAppScreenProps({
  appState,
  models,
  runtime,
  navigation,
}: AppScreenPropsArgs): UseAppScreenPropsResult {
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

  const schedulePtoDatabaseFlush = useCallback(() => {
    window.setTimeout(() => {
      void runtime.flushPtoDatabasePendingSave();
    }, 0);
  }, [runtime]);

  const guardedSelectTopTab = useCallback((tab: typeof topTab) => {
    if (tab === topTab) return;
    selectTopTab(tab);
    schedulePtoDatabaseFlush();
  }, [schedulePtoDatabaseFlush, selectTopTab, topTab]);

  const guardedSelectPtoTab = useCallback((tab: string) => {
    if (tab === ptoTab) return;
    selectPtoTab(tab);
  }, [selectPtoTab, ptoTab]);

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      if (!isAppNavigationEvent(event)) return;
      guardedSelectTopTab(event.detail.topTab as typeof topTab);
    };

    window.addEventListener(appNavigationEventName, handleNavigation);
    return () => window.removeEventListener(appNavigationEventName, handleNavigation);
  }, [guardedSelectTopTab, topTab]);

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
