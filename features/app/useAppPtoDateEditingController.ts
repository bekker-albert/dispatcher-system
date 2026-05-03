"use client";

import type { AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import { databaseConfigured } from "@/lib/data/config";

type UseAppPtoDateEditingControllerArgs = {
  appState: AppStateBundle;
  models: AppPtoModels;
  runtime: AppRuntimeControllers;
};

export function useAppPtoDateEditingController({
  appState,
  models,
  runtime,
}: UseAppPtoDateEditingControllerArgs) {
  const {
    subTabs,
    ptoTab,
    ptoRowFieldDrafts,
    setPtoRowFieldDrafts,
    ptoDatabaseLoadedRef,
    ptoPlanYear,
    setPtoPlanYear,
    ptoYearInput,
    setPtoYearInput,
    setPtoYearDialogOpen,
    setPtoManualYears,
    ptoAreaFilter,
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

  const { ptoYearTabs } = models;

  const {
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    requestPtoDatabaseSave,
  } = runtime;

  return useAppPtoDateEditing({
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
}
