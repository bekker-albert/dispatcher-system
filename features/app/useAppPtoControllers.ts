"use client";

import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

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
    ptoTab,
    setDraggedPtoRowId,
    setPtoDropTarget,
    setPtoFormulaCell,
    setPtoInlineEditCell,
    setPtoSelectedCellKeys,
    setPtoDateEditing,
    ptoPlanImportInputRef,
    ptoPlanYear,
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
  } = appState;

  const {
    renderedTopTab,
    isPtoDateTab,
  } = models;

  const {
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
    ptoSupplementalTables,
  };
}
