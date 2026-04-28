"use client";

import { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;

type UseAppNavigationControllersArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
};

export function useAppNavigationControllers({
  appState,
  models,
}: UseAppNavigationControllersArgs) {
  const {
    topTab,
    subTabs,
    customTabs,
    dispatchTab,
    ptoTab,
    adminSection,
    reportCustomerId,
    reportCustomers,
  } = appState;

  const {
    renderedTopTab,
  } = models;

  const navigation = useAppActiveNavigation({
    topTab,
    renderedTopTab,
    customTabs,
    subTabs,
    adminSection,
    dispatchTab,
    ptoTab,
    reportCustomerId,
    reportCustomers,
  });

  return {
    navigation,
  };
}
