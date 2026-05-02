"use client";

import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { databaseConfigured } from "@/lib/data/config";

type AppPtoModels = ReturnType<typeof useAppDerivedModels> & ReturnType<typeof useAppPtoDateModel>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;

type UseAppPtoControllersArgs = {
  appState: AppStateBundle;
  models: AppPtoModels;
  runtime: AppRuntimeControllers;
};

export function useAppPtoControllers({
  appState,
  models,
  runtime,
}: UseAppPtoControllersArgs) {
  const {
    subTabs,
    ptoTab,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
    setPtoDateEditing,
    ptoRowFieldDrafts,
    setPtoRowFieldDrafts,
    ptoPlanImportInputRef,
    ptoDatabaseLoadedRef,
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
    addAdminLog,
    showSaveStatus,
  } = appState;

  const {
    renderedTopTab,
    isPtoDateTab,
    ptoYearTabs,
  } = models;

  const {
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    requestPtoDatabaseSave,
  } = runtime;

  const ptoDateViewport = useAppPtoDateViewport({
    renderedTopTab,
    isPtoDateTab,
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
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    requestPtoDatabaseSave,
    showSaveStatus,
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

  const ptoSupplementalTables = useAppPtoSupplementalTables({
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoPlanImportInputRef,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    ptoDateViewport,
    ptoDateEditingHandlers,
    ptoSupplementalTables,
  };
}
