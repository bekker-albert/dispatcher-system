"use client";

import type { Dispatch, SetStateAction } from "react";

import { useDispatchSummaryEditor } from "@/features/dispatch/useDispatchSummaryEditor";
import { useDispatchSummaryViewModel } from "@/features/dispatch/useDispatchSummaryViewModel";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { ReportRow } from "@/lib/domain/reports/types";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type AddAdminLog = (entry: AdminLogInput) => void;

type UseAppDispatchSummaryModelOptions = {
  active: boolean;
  areaFilter: string;
  search: string;
  dispatchTab: string;
  reportDate: string;
  vehicleRows: VehicleRow[];
  dispatchSummaryRows: DispatchSummaryRow[];
  reportBaseRows: ReportRow[];
  ptoPlanRows: PtoPlanRow[];
  dispatchVehicleToAddId: string;
  setDispatchSummaryRows: Dispatch<SetStateAction<DispatchSummaryRow[]>>;
  setDispatchVehicleToAddId: Dispatch<SetStateAction<string>>;
  addAdminLog: AddAdminLog;
};

export function useAppDispatchSummaryModel({
  active,
  areaFilter,
  search,
  dispatchTab,
  reportDate,
  vehicleRows,
  dispatchSummaryRows,
  reportBaseRows,
  ptoPlanRows,
  dispatchVehicleToAddId,
  setDispatchSummaryRows,
  setDispatchVehicleToAddId,
  addAdminLog,
}: UseAppDispatchSummaryModelOptions) {
  const dispatchViewModel = useDispatchSummaryViewModel({
    active,
    areaFilter,
    search,
    dispatchTab,
    reportDate,
    vehicleRows,
    dispatchSummaryRows,
    reportBaseRows,
    ptoPlanRows,
  });

  const dispatchEditor = useDispatchSummaryEditor({
    isDailyDispatchShift: dispatchViewModel.isDailyDispatchShift,
    reportDate,
    currentDispatchShift: dispatchViewModel.currentDispatchShift,
    areaFilter,
    dispatchSummaryRows,
    currentDispatchSummaryRows: dispatchViewModel.currentDispatchSummaryRows,
    filteredDispatch: dispatchViewModel.filteredDispatch,
    dispatchVehicleOptions: dispatchViewModel.dispatchVehicleOptions,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
  });

  return {
    ...dispatchViewModel,
    ...dispatchEditor,
  };
}
