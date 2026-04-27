"use client";

import type { ComponentProps } from "react";

import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppAdminScreenProps } from "@/features/app/useAppAdminScreenProps";
import type { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppDispatchSectionProps } from "@/features/app/useAppDispatchSectionProps";
import { useAppHeaderProps } from "@/features/app/useAppHeaderProps";
import type { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import type { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSectionProps } from "@/features/app/useAppPtoSectionProps";
import type { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import { useAppReportsSectionProps } from "@/features/app/useAppReportsSectionProps";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import type { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";
import { databaseConfigured } from "@/lib/data/config";
import { defaultUserCard } from "@/lib/domain/reference/defaults";
import { AppHeader } from "@/components/layout/AppHeader";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
type AppPtoDateViewport = ReturnType<typeof useAppPtoDateViewport>;
type AppAdminReportEditors = ReturnType<typeof useAppAdminReportEditors>;
type AppPtoDateEditing = ReturnType<typeof useAppPtoDateEditing>;
type AppVehicleEditing = ReturnType<typeof useAppVehicleEditing>;
type AppPtoSupplementalTables = ReturnType<typeof useAppPtoSupplementalTables>;

type UseAppScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
  ptoDateViewport: AppPtoDateViewport;
  adminReportEditors: AppAdminReportEditors;
  ptoDateEditing: AppPtoDateEditing;
  vehicleEditing: AppVehicleEditing;
  ptoSupplementalTables: AppPtoSupplementalTables;
};

type UseAppScreenPropsResult = {
  appHeaderProps: ComponentProps<typeof AppHeader>;
  primaryContentProps: ComponentProps<typeof AppPrimaryContent>;
};

export function useAppScreenProps({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  adminReportEditors,
  ptoDateEditing,
  vehicleEditing,
  ptoSupplementalTables,
}: UseAppScreenPropsArgs): UseAppScreenPropsResult {
  const {
    topTab,
    topTabs,
    subTabs,
    customTabs,
    deleteCustomTab,
    dispatchTab,
    setDispatchTab,
    fleetTab,
    setFleetTab,
    contractorTab,
    setContractorTab,
    fuelTab,
    setFuelTab,
    ptoTab,
    tbTab,
    setTbTab,
    adminSection,
    setAdminSection,
    dispatchVehicleToAddId,
    setDispatchVehicleToAddId,
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
    ptoDateEditing: ptoDateEditingEnabled,
    setPtoDateEditing,
    hoveredPtoAddRowId,
    setHoveredPtoAddRowId,
    setPtoPendingFieldFocus,
    ptoDraftRowFields,
    setPtoDraftRowFields,
    ptoSelectionDraggingRef,
    ptoPlanImportInputRef,
    reportArea,
    setReportArea,
    reportCustomerId,
    setReportCustomerId,
    reportCustomers,
    reportReasons,
    ptoPlanYear,
    setPtoYearInput,
    ptoYearInput,
    setPtoYearDialogOpen,
    ptoYearDialogOpen,
    ptoAreaFilter,
    setExpandedPtoMonths,
    ptoPlanRows,
    setPtoPlanRows,
    ptoSurveyRows,
    setPtoSurveyRows,
    ptoOperRows,
    setPtoOperRows,
    ptoColumnWidths,
    ptoRowHeights,
    editingPtoHeaderKey,
    ptoHeaderDraft,
    setPtoHeaderDraft,
    ptoBucketValues,
    reportDate,
    selectReportDate,
    ptoDatabaseMessage,
    ptoDatabaseReady,
    areaFilter,
    setAreaFilter,
    search,
    setSearch,
    selectTopTab,
    selectPtoTab,
    selectPtoPlanYear,
    selectPtoArea,
  } = appState;

  const {
    renderedTopTab,
    activeReportCustomer,
    reportAreaTabs,
    filteredReports,
    filteredReportAreaGroups,
    visibleReportColumnKeys,
    reportTableColumnWidths,
    reportColumnWidthByKey,
    reportCompletionCards,
    isPtoDateTab,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
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
    filteredFleet,
  } = models;

  const {
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
    savePtoLocalState,
    commitReportDayReason,
    cancelReportDayReasonDraft,
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
    cancelPtoHeaderEdit,
    commitPtoHeaderEdit,
    printReport,
    ptoHeaderLabel,
    reportHeaderLabel,
    renderReportHeaderText,
    startPtoHeaderEdit,
    startPtoColumnResize,
    startReportColumnResize,
    startPtoRowResize,
  } = runtime;

  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerHasSubtabs,
    headerSubtabsOffset,
    activeCustomTab,
    activeDispatchSubtab,
    activePtoSubtab,
  } = navigation;

  const {
    viewport: ptoDateViewportState,
    scrollRef: ptoDateTableScrollRef,
    updateViewportFromElement: updatePtoDateViewportFromElement,
    handleScroll: handlePtoDateTableScroll,
  } = ptoDateViewport;

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
  } = ptoDateEditing;

  const {
    ptoBucketRows,
    ptoBucketColumns,
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  } = ptoSupplementalTables;

  const ptoSectionProps = useAppPtoSectionProps({
    ptoTab,
    activePtoSubtabLabel: activePtoSubtab?.label ?? ptoTab,
    activePtoSubtabContent: activePtoSubtab?.content || "",
    isPtoDateTab,
    ptoAreaTabs,
    ptoAreaFilter,
    ptoBucketRows,
    ptoBucketColumns,
    ptoBucketValues,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    selectPtoArea,
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
    ptoPlanYear,
    reportDate,
    ptoYearMonths,
    ptoMonthGroups,
    ptoYearTabs,
    ptoYearDialogOpen,
    ptoYearInput,
    ptoDateEditing: ptoDateEditingEnabled,
    ptoColumnWidths,
    ptoRowHeights,
    ptoDateViewport: ptoDateViewportState,
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

  const reportsSectionProps = useAppReportsSectionProps({
    reportAreaTabs,
    reportArea,
    setReportArea,
    printReport,
    activeReportCustomer,
    reportDate,
    reportCompletionCards,
    reportTableColumnWidths,
    visibleReportColumnKeys,
    reportColumnWidthByKey,
    reportHeaderLabel,
    renderReportHeaderText,
    startReportColumnResize,
    filteredReportAreaGroups,
    filteredReports,
    reportReasons,
    commitReportDayReason,
    cancelReportDayReasonDraft,
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
  });

  const dispatchSectionProps = useAppDispatchSectionProps({
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

  const adminContent = useAppAdminScreenProps({
    appState,
    models,
    adminReportEditors,
    vehicleEditing,
  });

  const appHeaderProps = useAppHeaderProps({
    topTabs,
    customTabs,
    topTab,
    subTabs,
    headerHasSubtabs,
    headerSubtabsOffset,
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    reportCustomers,
    reportCustomerId,
    dispatchTab,
    ptoTab,
    adminSection,
    reportDate,
    selectTopTab,
    deleteCustomTab,
    setReportCustomerId,
    setDispatchTab,
    selectPtoTab,
    setAdminSection,
    selectReportDate,
  });

  return {
    appHeaderProps,
    primaryContentProps: {
      renderedTopTab,
      shouldGatePtoDatabase: databaseConfigured && !ptoDatabaseReady,
      ptoDatabaseMessage,
      reportsProps: reportsSectionProps,
      dispatchProps: dispatchSectionProps,
      fleetProps: {
        fleetTab,
        subTabs: subTabs.fleet,
        rows: filteredFleet,
        onSelectTab: setFleetTab,
      },
      contractorsProps: {
        contractorTab,
        subTabs: subTabs.contractors,
        onSelectTab: setContractorTab,
      },
      fuelProps: {
        fuelTab,
        subTabs: subTabs.fuel,
        onSelectTab: setFuelTab,
      },
      ptoProps: ptoSectionProps,
      safetyProps: {
        tbTab,
        subTabs: subTabs.tb,
        onSelectTab: setTbTab,
      },
      userProfileProps: { userCard: defaultUserCard },
      adminContent,
      customTabProps: activeCustomTab ? { tab: activeCustomTab } : null,
    },
  };
}
