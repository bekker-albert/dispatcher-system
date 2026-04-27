"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { AppPageShell } from "@/features/app/AppPageShell";
import { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import { useAppScreenProps } from "@/features/app/useAppScreenProps";
import { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";
import { databaseConfigured } from "@/lib/data/config";

export default function App() {
  const appState = useAppStateBundle();
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
    saveStatus,
    hideSaveStatus,
    showSaveStatus,
  } = appState;

  const runtime = useAppRuntimeControllers({ appState, databaseConfigured });
  const {
    pushVehicleUndoSnapshot,
    requestPtoDatabaseSave,
  } = runtime;

  const models = useAppDerivedModels({ appState });
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

  const {
    appHeaderProps,
    primaryContentProps,
  } = useAppScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    adminReportEditors,
    ptoDateEditing: ptoDateEditingHandlers,
    vehicleEditing,
    ptoSupplementalTables,
  });

  return (
    <AppPageShell saveStatus={saveStatus} onCloseSaveStatus={hideSaveStatus}>
      <AppHeader {...appHeaderProps} />
      <AppPrimaryContent {...primaryContentProps} />
    </AppPageShell>
  );
}
