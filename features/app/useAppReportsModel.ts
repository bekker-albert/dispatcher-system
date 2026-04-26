"use client";

import type { Dispatch, SetStateAction } from "react";

import { useAdminReportSettingsViewModel } from "@/features/reports/useAdminReportSettingsViewModel";
import { useAreaShiftScheduleAreas } from "@/features/reports/useAreaShiftScheduleAreas";
import { useCustomerReportViewModel } from "@/features/reports/useCustomerReportViewModel";
import { useReportColumnLayout } from "@/features/reports/useReportColumnLayout";
import { useReportRowsModel } from "@/features/reports/useReportRowsModel";
import { useReportSelectionGuards } from "@/features/reports/useReportSelectionGuards";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { AdminReportCustomerSettingsTab } from "@/lib/domain/admin/navigation";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { ReportCustomerConfig } from "@/lib/domain/reports/types";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseAppReportsModelOptions = {
  needsReportRows: boolean;
  needsReportIndexes: boolean;
  needsAutoReportRows: boolean;
  needsAdminReportRows: boolean;
  needsDerivedReportRows: boolean;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  deferredVehicleRows: VehicleRow[];
  reportDate: string;
  reportReasons: Record<string, string>;
  reportCustomers: ReportCustomerConfig[];
  reportCustomerId: string;
  setReportCustomerId: Dispatch<SetStateAction<string>>;
  adminReportCustomerId: string;
  adminReportCustomerSettingsTab: AdminReportCustomerSettingsTab;
  reportArea: string;
  setReportArea: Dispatch<SetStateAction<string>>;
  reportAreaOrder: string[];
  reportWorkOrder: Record<string, string[]>;
  editingReportFactSourceRowKey: string | null;
  areaShiftCutoffs: AreaShiftCutoffMap;
  reportHeaderLabels: Record<string, string>;
  reportColumnWidths: Record<string, number>;
};

export function useAppReportsModel({
  needsReportRows,
  needsReportIndexes,
  needsAutoReportRows,
  needsAdminReportRows,
  needsDerivedReportRows,
  deferredPtoPlanRows,
  deferredPtoSurveyRows,
  deferredPtoOperRows,
  deferredVehicleRows,
  reportDate,
  reportReasons,
  reportCustomers,
  reportCustomerId,
  setReportCustomerId,
  adminReportCustomerId,
  adminReportCustomerSettingsTab,
  reportArea,
  setReportArea,
  reportAreaOrder,
  reportWorkOrder,
  editingReportFactSourceRowKey,
  areaShiftCutoffs,
  reportHeaderLabels,
  reportColumnWidths,
}: UseAppReportsModelOptions) {
  const {
    reportBaseRows,
    derivedReportRows,
  } = useReportRowsModel({
    needsReportRows,
    needsReportIndexes,
    needsAutoReportRows,
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    reportDate,
    reportReasons,
  });

  const adminReportSettings = useAdminReportSettingsViewModel({
    needsAdminReportRows,
    reportCustomers,
    adminReportCustomerId,
    adminReportCustomerSettingsTab,
    reportBaseRows,
    derivedReportRows,
    reportAreaOrder,
    reportWorkOrder,
    editingReportFactSourceRowKey,
  });

  const customerReport = useCustomerReportViewModel({
    needsDerivedReportRows,
    reportCustomers,
    reportCustomerId,
    derivedReportRows,
    reportArea,
  });

  const areaShiftScheduleAreas = useAreaShiftScheduleAreas({
    areaShiftCutoffs,
    reportBaseRows,
    ptoPlanRows: deferredPtoPlanRows,
    ptoOperRows: deferredPtoOperRows,
    ptoSurveyRows: deferredPtoSurveyRows,
    vehicleRows: deferredVehicleRows,
    reportAreaOrder,
  });

  const reportColumnLayout = useReportColumnLayout({
    filteredReports: customerReport.filteredReports,
    needsDerivedReportRows,
    reportArea,
    reportDate,
    reportHeaderLabels,
    reportColumnWidths,
  });

  useReportSelectionGuards({
    reportCustomers,
    reportCustomerId,
    setReportCustomerId,
    reportArea,
    reportAreaTabs: customerReport.reportAreaTabs,
    setReportArea,
  });

  return {
    reportBaseRows,
    derivedReportRows,
    ...adminReportSettings,
    ...customerReport,
    areaShiftScheduleAreas,
    ...reportColumnLayout,
  };
}
