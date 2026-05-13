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
    dispatchDailyReportTab,
  } = appState;

  const {
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
    dispatchVehicleSelectOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchPtoPlanRows,
    dispatchExcavatorOptions,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
    addDispatchSummaryLink,
    addDumpTruckToDispatchLink,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
    deleteDispatchSummaryLink,
    deleteCurrentDispatchShiftRows,
  } = models;

  return useAppDispatchSectionProps({
    activeDispatchSubtab: navigation.activeDispatchSubtab,
    dispatchTab,
    reportDate,
    isDailyDispatchShift,
    currentDispatchShift,
    dailyReportTab: dispatchDailyReportTab,
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
    addDispatchSummaryLink,
    addDumpTruckToDispatchLink,
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    dispatchAiSuggestion,
    filteredDispatchSummaryRows,
    updateDispatchSummaryVehicle,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    deleteDispatchSummaryRow,
    deleteDispatchSummaryLink,
    deleteCurrentDispatchShiftRows,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchPtoPlanRows,
    dispatchExcavatorOptions,
  });
}
