"use client";

import type { AppDerivedModels, AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { useAppDispatchScreenProps } from "@/features/app/useAppDispatchScreenProps";
import { useAppDispatchSummaryModel } from "@/features/app/useAppDispatchSummaryModel";
import { useAppReportBaseRowsModel } from "@/features/app/useAppReportBaseRowsModel";
import { DispatchSection } from "@/features/app/lazySections";

type AppDispatchModels = AppDerivedModels & ReturnType<typeof useAppDispatchSummaryModel>;
type DispatchPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "navigation">;

export function DispatchPrimaryContent({
  appState,
  models,
  navigation,
}: DispatchPrimaryContentProps) {
  const {
    reportDate,
    reportReasons,
    reportAreaOrder,
    areaShiftCutoffs,
    areaFilter,
    search,
    dispatchTab,
    dispatchSummaryRows,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
    vehicleRows,
  } = appState;
  const reportBaseRowsModel = useAppReportBaseRowsModel({
    needsReportBaseRows: true,
    needsAreaShiftScheduleAreas: false,
    deferredPtoPlanRows: models.deferredPtoPlanRows,
    deferredPtoSurveyRows: models.deferredPtoSurveyRows,
    deferredPtoOperRows: models.deferredPtoOperRows,
    deferredVehicleRows: models.deferredVehicleRows,
    reportDate,
    reportReasons,
    areaShiftCutoffs,
    reportAreaOrder,
  });
  const dispatchSummaryModel = useAppDispatchSummaryModel({
    active: true,
    areaFilter,
    search,
    dispatchTab,
    reportDate,
    vehicleRows,
    dispatchSummaryRows,
    reportBaseRows: reportBaseRowsModel.reportBaseRows,
    dispatchVehicleToAddId,
    setDispatchSummaryRows,
    setDispatchVehicleToAddId,
    addAdminLog,
  });
  const dispatchModels: AppDispatchModels = { ...models, ...dispatchSummaryModel };

  const dispatchProps = useAppDispatchScreenProps({
    appState,
    models: dispatchModels,
    navigation,
  });

  return <DispatchSection {...dispatchProps} />;
}
