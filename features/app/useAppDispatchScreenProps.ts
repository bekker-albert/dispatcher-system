"use client";

import type { DispatchSectionProps } from "@/features/dispatch/DispatchSection";
import { useAppDispatchSectionProps } from "@/features/app/useAppDispatchSectionProps";
import type {
  AppDispatchModels,
  AppDispatchScreenState,
  AppNavigation,
} from "@/features/app/appScreenPropsTypes";

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
