"use client";

import type { DispatchSectionProps } from "@/features/dispatch/DispatchSection";
import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppDispatchSummaryModel } from "@/features/app/useAppDispatchSummaryModel";
import { useAppDispatchSectionProps } from "@/features/app/useAppDispatchSectionProps";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type AppDispatchModels = ReturnType<typeof useAppDerivedModels> & ReturnType<typeof useAppDispatchSummaryModel>;
type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
type AppDispatchScreenState = Pick<
  AppStateBundle,
  | "dispatchTab"
  | "reportDate"
  | "search"
  | "setSearch"
  | "areaFilter"
  | "setAreaFilter"
  | "dispatchVehicleToAddId"
  | "setDispatchVehicleToAddId"
>;

type UseAppDispatchScreenPropsArgs = {
  appState: AppDispatchScreenState;
  models: AppDispatchModels;
  navigation: AppNavigation;
};

export function useAppDispatchScreenProps({
  appState,
  models,
  navigation,
}: UseAppDispatchScreenPropsArgs): DispatchSectionProps {
  const {
    dispatchTab,
    reportDate,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    dispatchVehicleToAddId,
    setDispatchVehicleToAddId,
  } = appState;

  const {
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
    dispatchVehicleSelectOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
  } = models;

  return useAppDispatchSectionProps({
    activeDispatchSubtab: navigation.activeDispatchSubtab,
    dispatchTab,
    reportDate,
    isDailyDispatchShift,
    currentDispatchShift,
    dispatchSummaryTotals,
    search,
    setSearch,
    areaFilter,
    setAreaFilter,
    dispatchAreaOptions,
    dispatchVehicleToAddId,
    setDispatchVehicleToAddId,
    dispatchVehicleOptions,
    dispatchVehicleSelectOptions,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    dispatchAiSuggestion,
    filteredDispatchSummaryRows,
    updateDispatchSummaryVehicle,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    deleteDispatchSummaryRow,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
  });
}
