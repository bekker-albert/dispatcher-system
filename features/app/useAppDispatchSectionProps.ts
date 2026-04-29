"use client";

import type { Dispatch, SetStateAction } from "react";

import type { DispatchSectionProps, DispatchTotals, DispatchVehicleSelectOption } from "@/features/dispatch/DispatchSection";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseAppDispatchSectionPropsOptions = {
  activeDispatchSubtab: { label?: string; content?: string } | null | undefined;
  dispatchTab: string;
  reportDate: string;
  isDailyDispatchShift: boolean;
  currentDispatchShift: "daily" | "night" | "day";
  dispatchSummaryTotals: DispatchTotals;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  areaFilter: string;
  setAreaFilter: Dispatch<SetStateAction<string>>;
  dispatchAreaOptions: string[];
  dispatchVehicleToAddId: string;
  setDispatchVehicleToAddId: Dispatch<SetStateAction<string>>;
  dispatchVehicleOptions: VehicleRow[];
  dispatchVehicleSelectOptions: DispatchVehicleSelectOption[];
  addSelectedDispatchVehicle: () => void;
  addFilteredVehiclesToDispatchSummary: () => void;
  dispatchAiSuggestion: string;
  filteredDispatchSummaryRows: DispatchSummaryRow[];
  updateDispatchSummaryVehicle: DispatchSectionProps["onUpdateDispatchSummaryVehicle"];
  updateDispatchSummaryText: DispatchSectionProps["onUpdateDispatchSummaryText"];
  updateDispatchSummaryNumber: DispatchSectionProps["onUpdateDispatchSummaryNumber"];
  deleteDispatchSummaryRow: DispatchSectionProps["onDeleteDispatchSummaryRow"];
  dispatchLocationOptions: string[];
  dispatchWorkTypeOptions: string[];
  dispatchExcavatorOptions: string[];
};

export function useAppDispatchSectionProps({
  activeDispatchSubtab,
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
}: UseAppDispatchSectionPropsOptions): DispatchSectionProps {
  return {
    activeDispatchSubtabLabel: activeDispatchSubtab?.label ?? "Диспетчерская сводка",
    dispatchTab,
    activeDispatchSubtabContent: activeDispatchSubtab?.content || "",
    reportDate,
    isDailyDispatchShift,
    currentDispatchShift,
    dispatchSummaryTotals,
    search,
    onSearchChange: setSearch,
    areaFilter,
    onAreaFilterChange: setAreaFilter,
    dispatchAreaOptions,
    dispatchVehicleToAddId,
    onDispatchVehicleToAddIdChange: setDispatchVehicleToAddId,
    dispatchVehicleOptions,
    dispatchVehicleSelectOptions,
    onAddSelectedDispatchVehicle: addSelectedDispatchVehicle,
    onAddFilteredVehiclesToDispatchSummary: addFilteredVehiclesToDispatchSummary,
    dispatchAiSuggestion,
    filteredDispatchSummaryRows,
    onUpdateDispatchSummaryVehicle: updateDispatchSummaryVehicle,
    onUpdateDispatchSummaryText: updateDispatchSummaryText,
    onUpdateDispatchSummaryNumber: updateDispatchSummaryNumber,
    onDeleteDispatchSummaryRow: deleteDispatchSummaryRow,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
  };
}
