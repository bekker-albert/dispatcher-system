"use client";

import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppReportBaseRowsModel } from "@/features/app/useAppReportBaseRowsModel";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;

type UseAppAdminStructureScheduleModelArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
};

export function useAppAdminStructureScheduleModel({
  appState,
  models,
}: UseAppAdminStructureScheduleModelArgs): ReturnType<typeof useAppReportBaseRowsModel> {
  return useAppReportBaseRowsModel({
    needsReportBaseRows: appState.adminSection === "structure",
    needsAreaShiftScheduleAreas: appState.adminSection === "structure",
    deferredPtoPlanRows: models.deferredPtoPlanRows,
    deferredPtoSurveyRows: models.deferredPtoSurveyRows,
    deferredPtoOperRows: models.deferredPtoOperRows,
    deferredVehicleRows: models.deferredVehicleRows,
    reportDate: appState.reportDate,
    reportReasons: appState.reportReasons,
    areaShiftCutoffs: appState.areaShiftCutoffs,
    reportAreaOrder: appState.reportAreaOrder,
  });
}
