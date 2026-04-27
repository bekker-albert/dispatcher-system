"use client";

import { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";
import { databaseConfigured } from "@/lib/data/config";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;

type UseAppFeatureControllersArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
};

export function useAppFeatureControllers({
  appState,
  models,
  runtime,
}: UseAppFeatureControllersArgs) {
  const {
    topTab,
    subTabs,
    customTabs,
    dispatchTab,
    ptoTab,
    adminSection,
    setAdminReportCustomerId,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    vehicleRows,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    setPendingVehicleFocus,
    activeVehicleCell,
    setActiveVehicleCell,
    vehicleSelectionAnchorCell,
    setVehicleSelectionAnchorCell,
    selectedVehicleCellKeys,
    setSelectedVehicleCellKeys,
    editingVehicleCell,
    setEditingVehicleCell,
    vehicleCellDraft,
    setVehicleCellDraft,
    vehicleCellInitialDraft,
    setVehicleCellInitialDraft,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    vehicleImportInputRef,
    vehicleRowsRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
    ptoDateEditing,
    setPtoDateEditing,
    ptoRowFieldDrafts,
    setPtoRowFieldDrafts,
    ptoPlanImportInputRef,
    ptoDatabaseLoadedRef,
    reportCustomerId,
    setReportCustomerId,
    setEditingReportRowLabelKeys,
    setExpandedReportSummaryIds,
    reportCustomers,
    setReportCustomers,
    ptoPlanYear,
    setPtoPlanYear,
    ptoYearInput,
    setPtoYearInput,
    setPtoYearDialogOpen,
    setPtoManualYears,
    ptoAreaFilter,
    expandedPtoMonths,
    setExpandedPtoMonths,
    ptoPlanRows,
    setPtoPlanRows,
    ptoSurveyRows,
    setPtoSurveyRows,
    ptoOperRows,
    setPtoOperRows,
    ptoBucketManualRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    addAdminLog,
    showSaveStatus,
  } = appState;

  const {
    renderedTopTab,
    deferredVehicleRows,
    activeAdminReportCustomer,
    activeAdminReportBaseRows,
    activeAdminReportOrderRows,
    activeAdminReportRowsByKey,
    activeAdminReportSummaryAreaOptions,
    activeAdminReportAreaOptions,
    adminReportBaseRows,
    reportAutoRowKeysForCustomer,
    isPtoDateTab,
    isPtoBucketsSection,
    allPtoDateRows,
    ptoYearTabs,
    visibleVehicleRows,
    clearAllVehicleFilters,
  } = models;

  const {
    pushVehicleUndoSnapshot,
    requestPtoDatabaseSave,
  } = runtime;

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

  const ptoDateViewport = useAppPtoDateViewport({
    renderedTopTab,
    isPtoDateTab,
    ptoDateEditing,
    expandedPtoMonths,
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    setPtoDateEditing,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
  });

  const adminReportEditors = useAppAdminReportEditors({
    activeAdminReportAreaOptions,
    activeAdminReportBaseRows,
    activeAdminReportCustomer,
    activeAdminReportOrderRows,
    activeAdminReportRowsByKey,
    activeAdminReportSummaryAreaOptions,
    addAdminLog,
    adminReportBaseRows,
    reportAutoRowKeysForCustomer,
    reportCustomers,
    setAdminReportCustomerId,
    setEditingReportRowLabelKeys,
    setExpandedReportSummaryIds,
    setReportCustomerId,
    setReportCustomers,
  });

  const ptoDateEditingHandlers = useAppPtoDateEditing({
    addAdminLog,
    databaseConfigured,
    ptoAreaFilter,
    ptoDatabaseLoadedRef,
    ptoOperRows,
    ptoPlanRows,
    ptoPlanYear,
    ptoRowFieldDrafts,
    ptoSubTabs: subTabs.pto,
    ptoSurveyRows,
    ptoTab,
    ptoYearInput,
    ptoYearTabs,
    requestPtoDatabaseSave,
    setExpandedPtoMonths,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoPlanYear,
    setPtoRowFieldDrafts,
    setPtoSurveyRows,
    setPtoYearDialogOpen,
    setPtoYearInput,
  });

  const vehicleEditing = useAppVehicleEditing({
    vehicleRows,
    visibleVehicleRows,
    vehicleRowsRef,
    vehicleImportInputRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    databaseConfigured,
    activeVehicleCell,
    selectedVehicleCellKeys,
    editingVehicleCell,
    vehicleCellDraft,
    vehicleCellInitialDraft,
    vehicleSelectionAnchorCell,
    vehicleCellSkipBlurCommitRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    setPendingVehicleFocus,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    pushVehicleUndoSnapshot,
    clearAllVehicleFilters,
    showSaveStatus,
    addAdminLog,
  });

  const ptoSupplementalTables = useAppPtoSupplementalTables({
    isPtoBucketsSection,
    allPtoDateRows,
    deferredVehicleRows,
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketManualRows,
    ptoPlanImportInputRef,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    setPtoBucketValues,
    setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    navigation,
    ptoDateViewport,
    adminReportEditors,
    ptoDateEditingHandlers,
    vehicleEditing,
    ptoSupplementalTables,
  };
}
