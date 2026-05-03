"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { PtoDatePrimaryContent } from "@/features/app/PtoDatePrimaryContent";
import { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";

type PtoDateDataPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime" | "navigation">;

export function PtoDateDataPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoDateDataPrimaryContentProps) {
  const {
    ptoTab,
    ptoDateEditing,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
  } = appState;

  const ptoDateModel = useAppPtoDateModel({
    renderedTopTab: models.renderedTopTab,
    ptoTab,
    ptoDateEditing,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    deferredPtoPlanRows: models.deferredPtoPlanRows,
    deferredPtoOperRows: models.deferredPtoOperRows,
    deferredPtoSurveyRows: models.deferredPtoSurveyRows,
  });
  const ptoModels: AppPtoModels = { ...models, ...ptoDateModel };

  return <PtoDatePrimaryContent appState={appState} models={ptoModels} runtime={runtime} navigation={navigation} />;
}
