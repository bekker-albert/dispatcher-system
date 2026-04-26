"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AdminAiSection } from "@/features/admin/ai/AdminAiSection";
import { useClientSnapshotsPanel } from "@/features/admin/database/useClientSnapshotsPanel";
import { useAdminLogsState } from "@/features/admin/logs/useAdminLogsState";
import { defaultSubTabs, defaultVehicles } from "@/features/app/appDefaults";
import { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppDataLoadState } from "@/features/app/useAppDataLoadState";
import { useAppDeferredData } from "@/features/app/useAppDeferredData";
import { useAppHeaderEditors } from "@/features/app/useAppHeaderEditors";
import { useAppLocalPersistence } from "@/features/app/useAppLocalPersistence";
import { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppTableInteractionEffects } from "@/features/app/useAppTableInteractionEffects";
import { useAppUndoHistory } from "@/features/app/useAppUndoHistory";
import { useInitialAppDataLoad } from "@/features/app/useInitialAppDataLoad";
import { useSyncedRef } from "@/features/app/useSyncedRef";
import { ContractorsSection } from "@/features/contractors/ContractorsSection";
import { useDispatchFilterState } from "@/features/dispatch/useDispatchFilterState";
import { useDispatchSummaryState } from "@/features/dispatch/useDispatchSummaryState";
import { useDispatchSummaryEditor } from "@/features/dispatch/useDispatchSummaryEditor";
import { useDispatchSummaryViewModel } from "@/features/dispatch/useDispatchSummaryViewModel";
import { FleetSection } from "@/features/fleet/FleetSection";
import { useFleetRows } from "@/features/fleet/useFleetRows";
import { FuelSection } from "@/features/fuel/FuelSection";
import { vehicleFilterColumns } from "@/features/admin/vehicles/vehicleFilterColumns";
import { useAdminVehicleRowsViewModel } from "@/features/admin/vehicles/useAdminVehicleRowsViewModel";
import { useVehicleFilterMenu } from "@/features/admin/vehicles/useVehicleFilterMenu";
import { useVehicleUiState } from "@/features/admin/vehicles/useVehicleUiState";
import { AdminStructureSection } from "@/features/admin/structure/AdminStructureSection";
import { useAdminStructureState } from "@/features/admin/structure/useAdminStructureState";
import {
  AdminDatabaseSection,
  AdminLogsSection,
  AdminNavigationSection,
  AdminReportSettingsSection,
  AdminVehiclesSection,
  DispatchSection,
  PtoSection,
  ReportsSection,
} from "@/features/app/lazySections";
import { useAdminVehicleEditMode } from "@/features/admin/vehicles/useAdminVehicleEditMode";
import { useVehiclePendingFocus } from "@/features/admin/vehicles/useVehiclePendingFocus";
import { useVehicleExcelTransfer } from "@/features/admin/vehicles/useVehicleExcelTransfer";
import { useVehicleInlineGridEditor } from "@/features/admin/vehicles/useVehicleInlineGridEditor";
import { useVehicleRowsPersistence } from "@/features/admin/vehicles/useVehicleRowsPersistence";
import { useVehicleRowsEditor } from "@/features/admin/vehicles/useVehicleRowsEditor";
import { PtoDatabaseGate } from "@/features/pto/PtoDatabaseGate";
import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import { usePtoDateExcelTransfer } from "@/features/pto/usePtoDateExcelTransfer";
import { usePtoDateViewModel } from "@/features/pto/usePtoDateViewModel";
import { usePtoDatabaseLoad } from "@/features/pto/usePtoDatabaseLoad";
import { usePtoDatabaseSave } from "@/features/pto/usePtoDatabaseSave";
import { usePtoDatabaseState } from "@/features/pto/usePtoDatabaseState";
import { usePtoDatabaseUiState } from "@/features/pto/usePtoDatabaseUiState";
import { usePtoLocalPersistence } from "@/features/pto/usePtoLocalPersistence";
import { usePtoPersistentState } from "@/features/pto/usePtoPersistentState";
import { usePtoUiState } from "@/features/pto/usePtoUiState";
import { CustomTabSection } from "@/features/navigation/CustomTabSection";
import { useAppTabsState } from "@/features/navigation/useAppTabsState";
import { useNavigationSelectionHandlers } from "@/features/navigation/useNavigationSelectionHandlers";
import { useSectionSelectionState } from "@/features/navigation/useSectionSelectionState";
import { usePtoDateTableRenderer } from "@/features/pto/usePtoDateTableRenderer";
import { reportPrintCss } from "@/features/reports/printCss";
import { useAdminReportSettingsViewModel } from "@/features/reports/useAdminReportSettingsViewModel";
import { useAreaShiftCutoffEditor } from "@/features/reports/useAreaShiftCutoffEditor";
import { useAreaShiftScheduleAreas } from "@/features/reports/useAreaShiftScheduleAreas";
import { useCustomerReportViewModel } from "@/features/reports/useCustomerReportViewModel";
import { useReportDateSelectionState } from "@/features/reports/useReportDateSelectionState";
import { useReportColumnLayout } from "@/features/reports/useReportColumnLayout";
import { useReportReasonDrafts } from "@/features/reports/useReportReasonDrafts";
import { useReportRowsModel } from "@/features/reports/useReportRowsModel";
import { useReportSelectionGuards } from "@/features/reports/useReportSelectionGuards";
import { useReportUiState } from "@/features/reports/useReportUiState";
import { SafetySection } from "@/features/safety-driving/SafetySection";
import { UserProfileSection } from "@/features/users/UserProfileSection";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import { defaultUserCard } from "@/lib/domain/reference/defaults";
import { databaseConfigured, dataProviderLabel } from "@/lib/data/config";
import { clientSnapshotStats } from "@/lib/storage/client-snapshots";
import { SectionCard } from "@/shared/ui/layout";
import { SaveStatusIndicator } from "@/shared/ui/SaveStatusIndicator";
import { useSaveStatus } from "@/shared/ui/useSaveStatus";

export default function App() {
  const {
    topTab,
    setTopTab,
    topTabs,
    setTopTabs,
    subTabs,
    setSubTabs,
    customTabs,
    setCustomTabs,
    addCustomTab,
    updateTopTabLabel,
    deleteTopTab,
    showTopTab,
    updateCustomTabTitle,
    showCustomTab,
    deleteCustomTab,
  } = useAppTabsState({ defaultSubTabs });

  const {
    dispatchTab,
    setDispatchTab,
    fleetTab,
    setFleetTab,
    contractorTab,
    setContractorTab,
    fuelTab,
    setFuelTab,
    ptoTab,
    setPtoTab,
    tbTab,
    setTbTab,
    structureSection,
    setStructureSection,
    adminSection,
    setAdminSection,
  } = useSectionSelectionState();
  const {
    dispatchSummaryRows,
    setDispatchSummaryRows,
    dispatchVehicleToAddId,
    setDispatchVehicleToAddId,
  } = useDispatchSummaryState(defaultVehicles);
  const {
    adminVehiclesEditing,
    setAdminVehiclesEditing,
    showAllVehicleRows,
    setShowAllVehicleRows,
    vehiclePreviewRowLimit,
    setVehiclePreviewRowLimit,
    vehicleRows,
    setVehicleRows,
    vehicleFilters,
    setVehicleFilters,
    vehicleFilterDrafts,
    setVehicleFilterDrafts,
    openVehicleFilter,
    setOpenVehicleFilter,
    vehicleFilterSearch,
    setVehicleFilterSearch,
    pendingVehicleFocus,
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
    adminVehicleTableScrollRef,
    vehicleRowsRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
  } = useVehicleUiState(defaultVehicles);
  const {
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    adminDataLoaded,
    setAdminDataLoaded,
  } = useAppDataLoadState();
  const {
    draggedPtoRowId,
    setDraggedPtoRowId,
    ptoDropTarget,
    setPtoDropTarget,
    ptoFormulaCell,
    setPtoFormulaCell,
    ptoFormulaDraft,
    setPtoFormulaDraft,
    ptoInlineEditCell,
    setPtoInlineEditCell,
    ptoInlineEditInitialDraft,
    setPtoInlineEditInitialDraft,
    ptoSelectionAnchorCell,
    setPtoSelectionAnchorCell,
    ptoSelectedCellKeys,
    setPtoSelectedCellKeys,
    ptoDateEditing,
    setPtoDateEditing,
    hoveredPtoAddRowId,
    setHoveredPtoAddRowId,
    ptoPendingFieldFocus,
    setPtoPendingFieldFocus,
    ptoRowFieldDrafts,
    setPtoRowFieldDrafts,
    ptoDraftRowFields,
    setPtoDraftRowFields,
    ptoSelectionDraggingRef,
    ptoPlanImportInputRef,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
  } = usePtoUiState();
  const {
    reportArea,
    setReportArea,
    reportCustomerId,
    setReportCustomerId,
    adminReportCustomerId,
    setAdminReportCustomerId,
    adminReportCustomerSettingsTab,
    setAdminReportCustomerSettingsTab,
    editingReportRowLabelKeys,
    setEditingReportRowLabelKeys,
    expandedReportSummaryIds,
    setExpandedReportSummaryIds,
    editingReportFactSourceRowKey,
    setEditingReportFactSourceRowKey,
    reportCustomers,
    setReportCustomers,
    reportAreaOrder,
    setReportAreaOrder,
    reportWorkOrder,
    setReportWorkOrder,
    reportHeaderLabels,
    setReportHeaderLabels,
    reportColumnWidths,
    setReportColumnWidths,
    reportReasons,
    setReportReasons,
    editingReportHeaderKey,
    setEditingReportHeaderKey,
    reportHeaderDraft,
    setReportHeaderDraft,
    areaShiftCutoffs,
    setAreaShiftCutoffs,
  } = useReportUiState();
  const {
    ptoPlanYear,
    setPtoPlanYear,
    ptoYearInput,
    setPtoYearInput,
    ptoYearDialogOpen,
    setPtoYearDialogOpen,
    ptoManualYears,
    setPtoManualYears,
    ptoAreaFilter,
    setPtoAreaFilter,
    expandedPtoMonths,
    setExpandedPtoMonths,
    ptoPlanRows,
    setPtoPlanRows,
    ptoSurveyRows,
    setPtoSurveyRows,
    ptoOperRows,
    setPtoOperRows,
    ptoColumnWidths,
    setPtoColumnWidths,
    ptoRowHeights,
    setPtoRowHeights,
    ptoHeaderLabels,
    setPtoHeaderLabels,
    editingPtoHeaderKey,
    setEditingPtoHeaderKey,
    ptoHeaderDraft,
    setPtoHeaderDraft,
    ptoBucketValues,
    setPtoBucketValues,
    ptoBucketManualRows,
    setPtoBucketManualRows,
  } = usePtoPersistentState();
  const {
    orgMembers,
    setOrgMembers,
    orgMemberForm,
    editingOrgMemberId,
    setEditingOrgMemberId,
    updateOrgMember,
    updateOrgMemberForm,
    addOrgMember,
    deleteOrgMember,
    dependencyNodes,
    setDependencyNodes,
    dependencyLinks,
    setDependencyLinks,
    dependencyNodeForm,
    dependencyLinkForm,
    setDependencyLinkForm,
    editingDependencyNodeId,
    setEditingDependencyNodeId,
    editingDependencyLinkId,
    setEditingDependencyLinkId,
    updateDependencyNode,
    updateDependencyNodeForm,
    addDependencyNode,
    deleteDependencyNode,
    updateDependencyLink,
    updateDependencyLinkForm,
    addDependencyLink,
    deleteDependencyLink,
  } = useAdminStructureState();
  const {
    reportDate,
    selectReportDate,
  } = useReportDateSelectionState({
    topTab,
    adminSection,
    reportArea,
    ptoAreaFilter,
    areaShiftCutoffs,
  });
  const { updateAreaShiftCutoff } = useAreaShiftCutoffEditor({ setAreaShiftCutoffs });
  const {
    adminLogs,
    addAdminLog,
    restoreAdminLogs,
    clearAdminLogs,
    lastChangeLog,
    lastUploadLog,
  } = useAdminLogsState();
  const {
    ptoDatabaseMessage,
    setPtoDatabaseMessage,
    ptoDatabaseReady,
    setPtoDatabaseReady,
    ptoSaveRevision,
    setPtoSaveRevision,
  } = usePtoDatabaseUiState();
  const { saveStatus, showSaveStatus, hideSaveStatus } = useSaveStatus();
  const {
    clientSnapshots,
    databasePanelMessage,
    databasePanelLoading,
    saveClientSnapshotToDatabase,
    requestClientSnapshotSave,
    refreshClientSnapshots,
    createClientSnapshotNow,
    restoreClientSnapshot,
  } = useClientSnapshotsPanel({
    active: topTab === "admin" && adminSection === "database",
    showSaveStatus,
  });
  const {
    areaFilter,
    setAreaFilter,
    search,
    setSearch,
  } = useDispatchFilterState();
  const {
    selectTopTab,
    selectPtoTab,
    selectPtoPlanYear,
    selectPtoArea,
  } = useNavigationSelectionHandlers({
    setTopTab,
    setPtoTab,
    setPtoPlanYear,
    setPtoAreaFilter,
  });
  const ptoDatabaseState = usePtoDatabaseState({
    ptoManualYears,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketValues,
    ptoBucketManualRows,
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    expandedPtoMonths,
    reportColumnWidths,
    reportReasons,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
  });
  const ptoDatabaseStateRef = useSyncedRef(ptoDatabaseState);
  const {
    ptoDatabaseSaveSnapshotRef,
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
  } = usePtoDatabaseSave({
    adminDataLoaded,
    ptoSaveRevision,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    showSaveStatus,
  });
  const {
    pushVehicleUndoSnapshot,
    resetUndoHistoryForExternalRestore,
  } = useAppUndoHistory({
    adminDataLoaded,
    topTab,
    adminSection,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    vehicleRows,
    vehicleRowsRef,
    setPtoSaveRevision,
    addAdminLog,
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
    setReportCustomers,
    setReportAreaOrder,
    setReportWorkOrder,
    setReportHeaderLabels,
    setReportColumnWidths,
    setReportReasons,
    setAreaShiftCutoffs,
    setCustomTabs,
    setTopTabs,
    setSubTabs,
    setVehicleRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    setPtoPlanRows,
    setPtoSurveyRows,
    setPtoOperRows,
    setPtoColumnWidths,
    setPtoRowHeights,
    setPtoHeaderLabels,
    setPtoBucketValues,
    setPtoBucketManualRows,
    setOrgMembers,
    setDependencyNodes,
    setDependencyLinks,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoFormulaDraft,
    setEditingPtoHeaderKey,
    setPtoHeaderDraft,
    setEditingReportHeaderKey,
    setReportHeaderDraft,
    setOpenVehicleFilter,
  });

  useVehiclePendingFocus({
    pendingVehicleFocus,
    setPendingVehicleFocus,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setEditingVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
  });

  useInitialAppDataLoad({
    defaultSubTabs,
    saveClientSnapshotToDatabase,
    restoreAdminLogs,
    appDatabaseSaveSnapshotRef,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    vehiclesDatabaseLoadedRef,
    vehiclesDatabaseSaveSnapshotRef,
    hasStoredPtoStateRef,
    setAdminDataLoaded,
    setReportCustomers,
    setReportAreaOrder,
    setReportWorkOrder,
    setReportHeaderLabels,
    setReportColumnWidths,
    setReportReasons,
    setAreaShiftCutoffs,
    setCustomTabs,
    setTopTabs,
    setSubTabs,
    setVehicleRows,
    setDispatchSummaryRows,
    setPtoManualYears,
    setPtoPlanRows,
    setPtoSurveyRows,
    setPtoOperRows,
    setPtoColumnWidths,
    setPtoRowHeights,
    setPtoHeaderLabels,
    setPtoBucketValues,
    setPtoBucketManualRows,
    setOrgMembers,
    setDependencyNodes,
    setDependencyLinks,
    setDependencyLinkForm,
  });

  usePtoDatabaseLoad({
    adminDataLoaded,
    ptoDatabaseStateRef,
    hasStoredPtoStateRef,
    ptoDatabaseLoadedRef,
    ptoDatabaseSaveSnapshotRef,
    resetUndoHistoryForExternalRestore,
    showSaveStatus,
    setPtoDatabaseReady,
    setPtoDatabaseMessage,
    setPtoSaveRevision,
    setPtoManualYears,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    setPtoTab,
    setPtoPlanYear,
    setPtoAreaFilter,
    setExpandedPtoMonths,
    setReportColumnWidths,
    setReportReasons,
    setPtoColumnWidths,
    setPtoRowHeights,
    setPtoHeaderLabels,
  });

  useAppLocalPersistence({
    adminDataLoaded,
    appSettingsDatabaseLoadedRef,
    appSettingsDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
    reportCustomers,
    reportAreaOrder,
    reportWorkOrder,
    reportHeaderLabels,
    reportColumnWidths,
    reportReasons,
    areaShiftCutoffs,
    customTabs,
    topTabs,
    subTabs,
    dispatchSummaryRows,
    orgMembers,
    dependencyNodes,
    dependencyLinks,
    adminLogs,
  });

  useVehicleRowsPersistence({
    adminDataLoaded,
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    requestClientSnapshotSave,
    showSaveStatus,
  });

  const { savePtoLocalState } = usePtoLocalPersistence({
    adminDataLoaded,
    ptoDatabaseStateRef,
    ptoDatabaseLoadedRef,
    hasStoredPtoStateRef,
    requestClientSnapshotSave,
    ptoManualYears,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoColumnWidths,
    ptoRowHeights,
    ptoHeaderLabels,
    ptoBucketValues,
    ptoBucketManualRows,
  });

  const {
    commitReportDayReason,
    cancelReportDayReasonDraft,
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
  } = useReportReasonDrafts({
    reportDate,
    setReportReasons,
    requestSave: requestPtoDatabaseSave,
  });

  const {
    cancelPtoHeaderEdit,
    commitPtoHeaderEdit,
    printReport,
    ptoHeaderLabel,
    reportHeaderLabel,
    renderReportHeaderText,
    startPtoHeaderEdit,
  } = useAppHeaderEditors({
    ptoHeaderLabels,
    ptoHeaderDraft,
    setPtoHeaderLabels,
    setEditingPtoHeaderKey,
    setPtoHeaderDraft,
    reportHeaderLabels,
    reportHeaderDraft,
    editingReportHeaderKey,
    setReportHeaderLabels,
    setEditingReportHeaderKey,
    setReportHeaderDraft,
    requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    startPtoColumnResize,
    startReportColumnResize,
    startPtoRowResize,
  } = useAppTableInteractionEffects({
    ptoRowHeights,
    setPtoColumnWidths,
    setPtoRowHeights,
    setReportColumnWidths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
    ptoSelectionDraggingRef,
    vehicleSelectionDraggingRef,
    vehicleSelectionAnchorRef,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    pendingFieldFocus: ptoPendingFieldFocus,
    setPendingFieldFocus: setPtoPendingFieldFocus,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
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
  } = useAppDeferredData({
    ptoPlanRows,
    ptoSurveyRows,
    ptoOperRows,
    vehicleRows,
    topTab,
    adminSection,
  });

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

  const {
    activeAdminReportCustomer,
    adminReportBaseRows,
    derivedReportRowsByKey,
    reportAutoRowKeysForCustomer,
    activeAdminReportBaseRows,
    activeAdminReportVisibleRowKeys,
    activeAdminReportOrderRows,
    activeAdminReportAreaOptions,
    activeAdminReportSummaryAreaOptions,
    activeAdminReportRowsByKey,
    editingReportFactSourceRow,
    editingReportFactSourceOptions,
    adminReportWorkOrderGroups,
    activeAdminReportSelectedCount,
    activeAdminReportRowLabelEntries,
    activeAdminReportUsesSummaryRows,
    visibleAdminReportCustomerSettingsTab,
  } = useAdminReportSettingsViewModel({
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

  const {
    activeReportCustomer,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
  } = useCustomerReportViewModel({
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

  const {
    visibleReportColumnKeys,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
  } = useReportColumnLayout({
    filteredReports,
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
    reportAreaTabs,
    setReportArea,
  });

  const {
    isPtoDateTab,
    isPtoBucketsSection,
    allPtoDateRows,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
  } = usePtoDateViewModel({
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

  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active: isPtoBucketsSection,
    allPtoDateRows,
    manualRows: ptoBucketManualRows,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
  });

  const {
    vehicleAutocompleteOptions,
    activeVehicleFilterOptions,
    filteredVehicleRows,
    visibleVehicleRows,
    hiddenVehicleRowsCount,
    activeVehicleFilterCount,
  } = useAdminVehicleRowsViewModel({
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
  });
  const {
    openVehicleFilterMenu,
    toggleVehicleFilterDraftValue,
    selectAllVehicleFilterDraftValues,
    deselectAllVehicleFilterDraftValues,
    applyVehicleFilter,
    clearAllVehicleFilters,
  } = useVehicleFilterMenu({
    openVehicleFilter,
    vehicleFilters,
    vehicleFilterDrafts,
    vehicleRows,
    activeVehicleFilterOptions,
    setOpenVehicleFilter,
    setVehicleFilters,
    setVehicleFilterDrafts,
  });

  const {
    filteredDispatch,
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
    currentDispatchSummaryRows,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
  } = useDispatchSummaryViewModel({
    active: renderedTopTab === "dispatch",
    areaFilter,
    search,
    dispatchTab,
    reportDate,
    vehicleRows,
    dispatchSummaryRows,
    reportBaseRows,
  });
  const {
    addSelectedDispatchVehicle,
    addFilteredVehiclesToDispatchSummary,
    updateDispatchSummaryText,
    updateDispatchSummaryNumber,
    updateDispatchSummaryVehicle,
    deleteDispatchSummaryRow,
  } = useDispatchSummaryEditor({
    isDailyDispatchShift,
    reportDate,
    currentDispatchShift,
    dispatchSummaryRows,
    currentDispatchSummaryRows,
    filteredDispatch,
    dispatchVehicleOptions,
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

  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerHasSubtabs,
    headerSubtabsOffset,
    activeCustomTab,
    activeDispatchSubtab,
    activePtoSubtab,
  } = useAppActiveNavigation({
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
  const {
    viewport: ptoDateViewport,
    scrollRef: ptoDateTableScrollRef,
    updateViewportFromElement: updatePtoDateViewportFromElement,
    handleScroll: handlePtoDateTableScroll,
  } = useAppPtoDateViewport({
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

  const {
    updateReportCustomer,
    addReportCustomer,
    deleteReportCustomer,
    moveReportAreaOrder,
    moveReportWorkOrder,
    toggleReportCustomerRow,
    updateReportCustomerRowLabel,
    addReportCustomerRowLabel,
    changeReportCustomerRowLabelSource,
    removeReportCustomerRowLabel,
    startReportRowLabelEdit,
    finishReportRowLabelEdit,
    setReportCustomerFactSourceMode,
    toggleReportCustomerFactSourceRowKey,
    reportRowsForSummaryArea,
    addReportSummaryRow,
    startReportSummaryEdit,
    finishReportSummaryEdit,
    updateReportSummaryRow,
    toggleReportSummaryRowKey,
    removeReportSummaryRow,
  } = useAppAdminReportEditors({
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

  const {
    addLinkedPtoDateRow,
    addPtoYear,
    beginPtoRowTextDraft,
    cancelPtoRowTextDraft,
    clearPtoCarryoverOverride,
    commitPtoRowTextDraft,
    deletePtoYear,
    getPtoDropPosition,
    getPtoRowTextDraft,
    moveLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    updatePtoDateDay,
    updatePtoDateRow,
    updatePtoMonthTotal,
    updatePtoRowTextDraft,
  } = useAppPtoDateEditing({
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

  const {
    addVehicleRow,
    updateVehicleRow,
    toggleVehicleVisibility,
    deleteVehicle,
  } = useVehicleRowsEditor({
    vehicleRows,
    vehicleRowsRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setPendingVehicleFocus,
    pushVehicleUndoSnapshot,
    clearAllVehicleFilters,
    showSaveStatus,
    addAdminLog,
  });

  const {
    commitVehicleInlineCellEdit,
    vehicleCellInputProps,
  } = useVehicleInlineGridEditor({
    vehicleRows,
    visibleVehicleRows,
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
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    setVehicleCellDraft,
    setVehicleCellInitialDraft,
    setPendingVehicleFocus,
    updateVehicleRow,
    pushVehicleUndoSnapshot,
    addAdminLog,
  });
  const {
    startAdminVehiclesEditing,
    finishAdminVehiclesEditing,
  } = useAdminVehicleEditMode({
    editingVehicleCell,
    commitVehicleInlineCellEdit,
    setAdminVehiclesEditing,
    setShowAllVehicleRows,
    setActiveVehicleCell,
    setVehicleSelectionAnchorCell,
    setSelectedVehicleCellKeys,
    setEditingVehicleCell,
    vehicleRowsRef,
  });

  const {
    openVehicleImportFilePicker,
    importVehiclesFromExcel,
    exportVehiclesToExcel,
  } = useVehicleExcelTransfer({
    vehicleRows,
    vehicleImportInputRef,
    databaseConfigured,
    databaseLoadedRef: vehiclesDatabaseLoadedRef,
    databaseSaveSnapshotRef: vehiclesDatabaseSaveSnapshotRef,
    setVehicleRows,
    setVehicleFilters,
    setVehicleFilterDrafts,
    setOpenVehicleFilter,
    pushVehicleUndoSnapshot,
    showSaveStatus,
    addAdminLog,
  });

  const {
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
  } = usePtoDateExcelTransfer({
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    importInputRef: ptoPlanImportInputRef,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  } = usePtoBucketsEditor({
    ptoAreaFilter,
    ptoBucketRows,
    ptoBucketColumns,
    ptoBucketManualRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });
  const renderPtoDateTable = usePtoDateTableRenderer({
    ptoTab,
    ptoAreaFilter,
    ptoPlanYear,
    reportDate,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoYearTabs,
    ptoYearDialogOpen,
    ptoYearInput,
    ptoDateEditing,
    ptoColumnWidths,
    ptoRowHeights,
    ptoDateViewport,
    ptoDateOptionMaps,
    ptoDateTableScrollRef,
    ptoPlanImportInputRef,
    draggedPtoRowId,
    ptoDropTarget,
    hoveredPtoAddRowId,
    ptoFormulaCell,
    ptoFormulaDraft,
    ptoInlineEditCell,
    ptoInlineEditInitialDraft,
    ptoSelectionAnchorCell,
    ptoSelectedCellKeys,
    ptoSelectionDraggingRef,
    ptoDraftRowFields,
    editingPtoHeaderKey,
    ptoHeaderDraft,
    setPtoDateEditing,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoFormulaDraft,
    setPtoInlineEditCell,
    setPtoInlineEditInitialDraft,
    setPtoSelectionAnchorCell,
    setPtoSelectedCellKeys,
    setPtoYearInput,
    setPtoYearDialogOpen,
    setExpandedPtoMonths,
    setHoveredPtoAddRowId,
    setPtoDraftRowFields,
    setPtoPendingFieldFocus,
    setPtoHeaderDraft,
    savePtoLocalState,
    requestPtoDatabaseSave,
    savePtoDatabaseChanges,
    selectPtoArea,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    openPtoDateImportFilePicker,
    importPtoDateTableFromExcel,
    selectPtoPlanYear,
    deletePtoYear,
    addPtoYear,
    updatePtoDateViewportFromElement,
    handlePtoDateTableScroll,
    startPtoColumnResize,
    startPtoRowResize,
    addLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    getPtoDropPosition,
    moveLinkedPtoDateRow,
    updatePtoDateRow,
    clearPtoCarryoverOverride,
    updatePtoDateDay,
    updatePtoMonthTotal,
    beginPtoRowTextDraft,
    getPtoRowTextDraft,
    updatePtoRowTextDraft,
    commitPtoRowTextDraft,
    cancelPtoRowTextDraft,
    ptoHeaderLabel,
    startPtoHeaderEdit,
    commitPtoHeaderEdit,
    cancelPtoHeaderEdit,
  });
  const shouldGatePtoDatabase = databaseConfigured && !ptoDatabaseReady;

  return (
    <div className="app-print-root" style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px", fontFamily: "var(--app-font)", color: "#0f172a", lineHeight: 1.35 }}>
      <style>{`${reportPrintCss}\n@media print { .app-save-status { display: none !important; } }`}</style>
      <SaveStatusIndicator status={saveStatus} onClose={hideSaveStatus} />
      <div className="app-print-shell" style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
        <AppHeader
          topTabs={topTabs}
          customTabs={customTabs}
          topTab={topTab}
          subTabs={subTabs}
          headerHasSubtabs={headerHasSubtabs}
          headerSubtabsOffset={headerSubtabsOffset}
          headerNavRef={headerNavRef}
          activeHeaderTabRef={activeHeaderTabRef}
          headerSubtabsRef={headerSubtabsRef}
          reportCustomers={reportCustomers}
          reportCustomerId={reportCustomerId}
          dispatchTab={dispatchTab}
          ptoTab={ptoTab}
          adminSection={adminSection}
          reportDate={reportDate}
          onSelectTopTab={selectTopTab}
          onDeleteCustomTab={deleteCustomTab}
          onSelectReportCustomer={setReportCustomerId}
          onSelectDispatchTab={setDispatchTab}
          onSelectPtoTab={selectPtoTab}
          onSelectAdminSection={setAdminSection}
          onSelectReportDate={selectReportDate}
        />
        {renderedTopTab === "reports" && (
          shouldGatePtoDatabase ? <PtoDatabaseGate message={ptoDatabaseMessage} /> : (
          <ReportsSection
            reportAreaTabs={reportAreaTabs}
            reportArea={reportArea}
            onSelectReportArea={setReportArea}
            onPrintReport={printReport}
            activeReportCustomerLabel={activeReportCustomer.label}
            reportDate={reportDate}
            reportCompletionCards={reportCompletionCards}
            reportTableColumnWidths={reportTableColumnWidths}
            reportColumnKeys={visibleReportColumnKeys}
            reportColumnWidthByKey={reportColumnWidthByKey}
            reportHeaderLabel={reportHeaderLabel}
            renderReportHeaderText={renderReportHeaderText}
            onStartReportColumnResize={startReportColumnResize}
            filteredReportAreaGroups={filteredReportAreaGroups}
            filteredReportsCount={filteredReports.length}
            reportReasons={reportReasons}
            onCommitReportDayReason={commitReportDayReason}
            onCancelReportDayReasonDraft={cancelReportDayReasonDraft}
            onUpdateReportDayReasonDraft={updateReportDayReasonDraft}
            onCommitReportYearReason={commitReportYearReason}
            onCancelReportYearReasonDraft={cancelReportYearReasonDraft}
            onUpdateReportYearReasonDraft={updateReportYearReasonDraft}
          />
          )
        )}

        {renderedTopTab === "dispatch" && (
          <DispatchSection
            activeDispatchSubtabLabel={activeDispatchSubtab?.label ?? "Диспетчерская сводка"}
            dispatchTab={dispatchTab}
            activeDispatchSubtabContent={activeDispatchSubtab?.content || ""}
            reportDate={reportDate}
            isDailyDispatchShift={isDailyDispatchShift}
            currentDispatchShift={currentDispatchShift}
            dispatchSummaryTotals={dispatchSummaryTotals}
            search={search}
            onSearchChange={setSearch}
            areaFilter={areaFilter}
            onAreaFilterChange={setAreaFilter}
            dispatchAreaOptions={dispatchAreaOptions}
            dispatchVehicleToAddId={dispatchVehicleToAddId}
            onDispatchVehicleToAddIdChange={setDispatchVehicleToAddId}
            dispatchVehicleOptions={dispatchVehicleOptions}
            onAddSelectedDispatchVehicle={addSelectedDispatchVehicle}
            onAddFilteredVehiclesToDispatchSummary={addFilteredVehiclesToDispatchSummary}
            dispatchAiSuggestion={dispatchAiSuggestion}
            filteredDispatchSummaryRows={filteredDispatchSummaryRows}
            onUpdateDispatchSummaryVehicle={updateDispatchSummaryVehicle}
            onUpdateDispatchSummaryText={updateDispatchSummaryText}
            onUpdateDispatchSummaryNumber={updateDispatchSummaryNumber}
            onDeleteDispatchSummaryRow={deleteDispatchSummaryRow}
            dispatchLocationOptions={dispatchLocationOptions}
            dispatchWorkTypeOptions={dispatchWorkTypeOptions}
            dispatchExcavatorOptions={dispatchExcavatorOptions}
          />
        )}

        {renderedTopTab === "fleet" && (
          <FleetSection
            fleetTab={fleetTab}
            subTabs={subTabs.fleet}
            rows={filteredFleet}
            onSelectTab={setFleetTab}
          />
        )}
        {renderedTopTab === "contractors" && (
          <ContractorsSection
            contractorTab={contractorTab}
            subTabs={subTabs.contractors}
            onSelectTab={setContractorTab}
          />
        )}
        {renderedTopTab === "fuel" && (
          <FuelSection
            fuelTab={fuelTab}
            subTabs={subTabs.fuel}
            onSelectTab={setFuelTab}
          />
        )}
        {renderedTopTab === "pto" && (
          shouldGatePtoDatabase ? <PtoDatabaseGate message={ptoDatabaseMessage} /> : (
          <PtoSection
            ptoTab={ptoTab}
            activePtoSubtabLabel={activePtoSubtab?.label ?? ptoTab}
            activePtoSubtabContent={activePtoSubtab?.content || ""}
            isPtoDateTab={isPtoDateTab}
            ptoAreaTabs={ptoAreaTabs}
            ptoAreaFilter={ptoAreaFilter}
            onSelectArea={selectPtoArea}
            ptoBucketRows={ptoBucketRows}
            ptoBucketColumns={ptoBucketColumns}
            ptoBucketValues={ptoBucketValues}
            onCommitBucketValue={commitPtoBucketValue}
            onClearBucketCells={clearPtoBucketCells}
            onAddBucketManualRow={addPtoBucketManualRow}
            onDeleteBucketManualRow={deletePtoBucketManualRow}
            renderPlanTable={() => renderPtoDateTable(
              ptoPlanRows,
              setPtoPlanRows,
              { showLocation: false, editableMonthTotal: true },
            )}
            renderOperTable={() => renderPtoDateTable(
              ptoOperRows,
              setPtoOperRows,
              { showLocation: false, editableMonthTotal: false },
            )}
            renderSurveyTable={() => renderPtoDateTable(
              ptoSurveyRows,
              setPtoSurveyRows,
              { showLocation: false, editableMonthTotal: false },
            )}
          />
          )
        )}

        {renderedTopTab === "tb" && (
          <SafetySection
            tbTab={tbTab}
            subTabs={subTabs.tb}
            onSelectTab={setTbTab}
          />
        )}
        {renderedTopTab === "user" && (
          <UserProfileSection userCard={defaultUserCard} />
        )}
        {renderedTopTab === "admin" && (
          <SectionCard title="">
            {adminSection === "navigation" && (
              <AdminNavigationSection
                topTabs={topTabs}
                customTabs={customTabs}
                onAddCustomTab={addCustomTab}
                onUpdateTopTabLabel={updateTopTabLabel}
                onUpdateCustomTabTitle={updateCustomTabTitle}
                onDeleteTopTab={deleteTopTab}
                onShowTopTab={showTopTab}
                onDeleteCustomTab={deleteCustomTab}
                onShowCustomTab={showCustomTab}
              />
            )}

            {adminSection === "structure" && (
              <AdminStructureSection
                structureSection={structureSection}
                onSelectStructureSection={setStructureSection}
                dependencyNodes={dependencyNodes}
                dependencyLinks={dependencyLinks}
                dependencyNodeForm={dependencyNodeForm}
                dependencyLinkForm={dependencyLinkForm}
                editingDependencyNodeId={editingDependencyNodeId}
                editingDependencyLinkId={editingDependencyLinkId}
                onEditDependencyNode={setEditingDependencyNodeId}
                onEditDependencyLink={setEditingDependencyLinkId}
                onUpdateDependencyNode={updateDependencyNode}
                onUpdateDependencyNodeForm={updateDependencyNodeForm}
                onAddDependencyNode={addDependencyNode}
                onDeleteDependencyNode={deleteDependencyNode}
                onUpdateDependencyLink={updateDependencyLink}
                onUpdateDependencyLinkForm={updateDependencyLinkForm}
                onAddDependencyLink={addDependencyLink}
                onDeleteDependencyLink={deleteDependencyLink}
                orgMembers={orgMembers}
                orgMemberForm={orgMemberForm}
                editingOrgMemberId={editingOrgMemberId}
                onEditOrgMember={setEditingOrgMemberId}
                onUpdateOrgMember={updateOrgMember}
                onUpdateOrgMemberForm={updateOrgMemberForm}
                onAddOrgMember={addOrgMember}
                onDeleteOrgMember={deleteOrgMember}
                areaShiftScheduleAreas={areaShiftScheduleAreas}
                areaShiftCutoffs={areaShiftCutoffs}
                onUpdateAreaShiftCutoff={updateAreaShiftCutoff}
              />
            )}

            {adminSection === "ai" && (
              <AdminAiSection />
            )}

            {adminSection === "vehicles" && (
              <AdminVehiclesSection
                activeVehicleFilterCount={activeVehicleFilterCount}
                filteredVehicleRowsCount={filteredVehicleRows.length}
                totalVehicleRowsCount={vehicleRows.length}
                adminVehiclesEditing={adminVehiclesEditing}
                visibleVehicleRows={visibleVehicleRows}
                hiddenVehicleRowsCount={hiddenVehicleRowsCount}
                vehicleAutocompleteOptions={vehicleAutocompleteOptions}
                vehicleFilterColumns={vehicleFilterColumns}
                openVehicleFilter={openVehicleFilter}
                activeVehicleFilterOptions={activeVehicleFilterOptions}
                vehicleFilters={vehicleFilters}
                vehicleFilterDrafts={vehicleFilterDrafts}
                vehicleFilterSearch={vehicleFilterSearch}
                adminVehicleTableScrollRef={adminVehicleTableScrollRef}
                vehicleImportInputRef={vehicleImportInputRef}
                onClearAllVehicleFilters={clearAllVehicleFilters}
                onStartEditing={startAdminVehiclesEditing}
                onFinishEditing={finishAdminVehiclesEditing}
                onAddVehicleRow={addVehicleRow}
                onOpenVehicleImportFilePicker={openVehicleImportFilePicker}
                onExportVehiclesToExcel={exportVehiclesToExcel}
                onImportVehiclesFromExcel={importVehiclesFromExcel}
                onOpenVehicleFilterMenu={openVehicleFilterMenu}
                onVehicleFilterSearchChange={(key, value) => setVehicleFilterSearch((current) => ({ ...current, [key]: value }))}
                onToggleVehicleFilterDraftValue={toggleVehicleFilterDraftValue}
                onSelectAllVehicleFilterDraftValues={selectAllVehicleFilterDraftValues}
                onDeselectAllVehicleFilterDraftValues={deselectAllVehicleFilterDraftValues}
                onApplyVehicleFilter={applyVehicleFilter}
                onCloseVehicleFilterMenu={() => setOpenVehicleFilter(null)}
                onToggleVehicleVisibility={toggleVehicleVisibility}
                vehicleCellInputProps={vehicleCellInputProps}
                onVehicleCellChange={updateVehicleRow}
                onDeleteVehicle={deleteVehicle}
                onShowAllVehicleRows={() => setShowAllVehicleRows(true)}
              />
            )}

            {adminSection === "database" && (
              <AdminDatabaseSection
                databaseConfigured={databaseConfigured}
                databaseProviderLabel={dataProviderLabel}
                ptoMemoryTotal={countPtoStateData({ planRows: ptoPlanRows, operRows: ptoOperRows, surveyRows: ptoSurveyRows, bucketRows: ptoBucketManualRows, bucketValues: ptoBucketValues }).total}
                vehicleCount={vehicleRows.length}
                snapshots={clientSnapshots}
                message={databasePanelMessage}
                loading={databasePanelLoading}
                getSnapshotStats={clientSnapshotStats}
                onCreateSnapshot={createClientSnapshotNow}
                onRefreshSnapshots={refreshClientSnapshots}
                onRestoreSnapshot={restoreClientSnapshot}
              />
            )}

            {adminSection === "logs" && (
              <AdminLogsSection
                logs={adminLogs}
                lastChangeLog={lastChangeLog}
                lastUploadLog={lastUploadLog}
                onClearLogs={clearAdminLogs}
              />
            )}

            {adminSection === "reports" && (
              <AdminReportSettingsSection
                customers={reportCustomers}
                activeCustomer={activeAdminReportCustomer}
                settingsTab={visibleAdminReportCustomerSettingsTab}
                selectedCount={activeAdminReportSelectedCount}
                usesSummaryRows={activeAdminReportUsesSummaryRows}
                areaOptions={activeAdminReportAreaOptions}
                summaryAreaOptions={activeAdminReportSummaryAreaOptions}
                workOrderGroups={adminReportWorkOrderGroups}
                baseRows={activeAdminReportBaseRows}
                rowsByKey={activeAdminReportRowsByKey}
                visibleRowKeys={activeAdminReportVisibleRowKeys}
                derivedRowsByKey={derivedReportRowsByKey}
                editingFactSourceRow={editingReportFactSourceRow}
                editingFactSourceOptions={editingReportFactSourceOptions}
                rowLabelEntries={activeAdminReportRowLabelEntries}
                editingRowLabelKeys={editingReportRowLabelKeys}
                expandedSummaryIds={expandedReportSummaryIds}
                rowsForArea={reportRowsForSummaryArea}
                onSelectCustomer={setAdminReportCustomerId}
                onAddCustomer={addReportCustomer}
                onDeleteCustomer={deleteReportCustomer}
                onUpdateCustomer={updateReportCustomer}
                onSetSettingsTab={setAdminReportCustomerSettingsTab}
                onMoveArea={moveReportAreaOrder}
                onMoveWork={moveReportWorkOrder}
                onToggleCustomerRow={toggleReportCustomerRow}
                onEditFactSource={setEditingReportFactSourceRowKey}
                onSetFactSourceMode={setReportCustomerFactSourceMode}
                onToggleFactSourceRow={toggleReportCustomerFactSourceRowKey}
                onAddRowLabel={addReportCustomerRowLabel}
                onChangeRowLabelSource={changeReportCustomerRowLabelSource}
                onUpdateRowLabel={updateReportCustomerRowLabel}
                onStartRowLabelEdit={startReportRowLabelEdit}
                onFinishRowLabelEdit={finishReportRowLabelEdit}
                onRemoveRowLabel={removeReportCustomerRowLabel}
                onAddSummaryRow={addReportSummaryRow}
                onUpdateSummaryRow={updateReportSummaryRow}
                onToggleSummaryRow={toggleReportSummaryRowKey}
                onStartSummaryEdit={startReportSummaryEdit}
                onFinishSummaryEdit={finishReportSummaryEdit}
                onRemoveSummaryRow={removeReportSummaryRow}
              />
            )}

          </SectionCard>
        )}

        {activeCustomTab && <CustomTabSection tab={activeCustomTab} />}
      </div>
    </div>
  );
}
