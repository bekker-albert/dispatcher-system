"use client";

import type { PtoSectionProps } from "@/features/pto/PtoSection";
import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import type { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSectionProps } from "@/features/app/useAppPtoSectionProps";
import type { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
type AppPtoDateViewport = ReturnType<typeof useAppPtoDateViewport>;
type AppPtoDateEditing = ReturnType<typeof useAppPtoDateEditing>;
type AppPtoSupplementalTables = ReturnType<typeof useAppPtoSupplementalTables>;

type UseAppPtoScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
  ptoDateViewport: AppPtoDateViewport;
  ptoDateEditing: AppPtoDateEditing;
  ptoSupplementalTables: AppPtoSupplementalTables;
};

export function useAppPtoScreenProps({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  ptoDateEditing,
  ptoSupplementalTables,
}: UseAppPtoScreenPropsArgs): PtoSectionProps {
  const {
    ptoTab,
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
    selectPtoPlanYear,
    selectPtoArea,
  } = appState;

  const {
    isPtoDateTab,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
  } = models;

  const {
    savePtoDatabaseChanges,
    requestPtoDatabaseSave,
    savePtoLocalState,
    cancelPtoHeaderEdit,
    commitPtoHeaderEdit,
    ptoHeaderLabel,
    startPtoHeaderEdit,
    startPtoColumnResize,
    startPtoRowResize,
  } = runtime;

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

  return useAppPtoSectionProps({
    ptoTab,
    activePtoSubtabLabel: navigation.activePtoSubtab?.label ?? ptoTab,
    activePtoSubtabContent: navigation.activePtoSubtab?.content || "",
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
}
