"use client";

import { useAppDeferredData } from "@/features/app/useAppDeferredData";
import { useAppDispatchSummaryModel } from "@/features/app/useAppDispatchSummaryModel";
import { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { useAppVehicleViewModel } from "@/features/app/useAppVehicleViewModel";
import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { useFleetRows } from "@/features/fleet/useFleetRows";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;

type UseAppDerivedModelsArgs = {
  appState: AppStateBundle;
};

export function useAppDerivedModels({ appState }: UseAppDerivedModelsArgs) {
  const {
    topTab,
    adminSection,
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    vehicleFilters,
    setVehicleFilters,
    vehicleFilterDrafts,
    setVehicleFilterDrafts,
    openVehicleFilter,
    setOpenVehicleFilter,
    adminVehicleTableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
    ptoTab,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketManualRows,
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
    areaFilter,
    search,
    dispatchTab,
    dispatchSummaryRows,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
    fleetTab,
  } = appState;

  const deferredData = useAppDeferredData({
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    vehicleRows,
    topTab,
    adminSection,
  });

  const {
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    deferredVehicleRows,
    renderedTopTab,
    needsReportRows,
    needsDerivedReportRows,
    needsAdminReportRows,
    needsReportIndexes,
    needsAutoReportRows,
  } = deferredData;

  const reportsModel = useAppReportsModel({
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
  });

  const ptoDateModel = useAppPtoDateModel({
    renderedTopTab,
    ptoTab,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    deferredPtoPlanRows,
    deferredPtoOperRows,
    deferredPtoSurveyRows,
    ptoBucketManualRows,
  });

  const vehicleViewModel = useAppVehicleViewModel({
    active: renderedTopTab === "admin" && adminSection === "vehicles",
    adminVehiclesEditing,
    showAllVehicleRows,
    vehiclePreviewRowLimit,
    vehicleRows,
    deferredVehicleRows,
    vehicleFilters,
    openVehicleFilter,
    tableScrollRef: adminVehicleTableScrollRef,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setVehiclePreviewRowLimit,
    vehicleFilterDrafts,
    setOpenVehicleFilter,
    setVehicleFilters,
    setVehicleFilterDrafts,
  });

  const dispatchSummaryModel = useAppDispatchSummaryModel({
    active: renderedTopTab === "dispatch",
    areaFilter,
    search,
    dispatchTab,
    reportDate,
    vehicleRows,
    dispatchSummaryRows,
    reportBaseRows: reportsModel.reportBaseRows,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
  });

  const filteredFleet = useFleetRows({
    active: renderedTopTab === "fleet",
    fleetTab,
    vehicleRows,
  });

  return {
    ...deferredData,
    ...reportsModel,
    ...ptoDateModel,
    ...vehicleViewModel,
    ...dispatchSummaryModel,
    filteredFleet,
    vehicleFilterColumns,
  };
}
