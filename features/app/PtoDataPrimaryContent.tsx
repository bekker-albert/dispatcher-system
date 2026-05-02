"use client";

import dynamic from "next/dynamic";
import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { usePtoDateEditingGlobalReset } from "@/features/app/usePtoDateEditingGlobalReset";

type PtoDataPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime" | "navigation">;

const PtoDatePrimaryContent = dynamic(
  () => import("@/features/app/PtoDatePrimaryContent")
    .then((module) => module.PtoDatePrimaryContent),
  { ssr: false },
);

const PtoBucketsPrimaryContent = dynamic(
  () => import("@/features/app/PtoBucketsPrimaryContent")
    .then((module) => module.PtoBucketsPrimaryContent),
  { ssr: false },
);

const PtoStaticPrimaryContent = dynamic(
  () => import("@/features/app/PtoStaticPrimaryContent")
    .then((module) => module.PtoStaticPrimaryContent),
  { ssr: false },
);

export function PtoDataPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoDataPrimaryContentProps) {
  const {
    ptoTab,
    ptoDateEditing,
    ptoPlanYear,
    ptoManualYears,
    expandedPtoMonths,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoBucketManualRows,
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
    ptoBucketManualRows,
  });
  const ptoModels: AppPtoModels = { ...models, ...ptoDateModel };

  usePtoDateEditingGlobalReset({ appState, models: ptoModels });

  if (ptoDateModel.isPtoDateTab) {
    return <PtoDatePrimaryContent appState={appState} models={ptoModels} runtime={runtime} navigation={navigation} />;
  }

  if (ptoDateModel.isPtoBucketsSection) {
    return <PtoBucketsPrimaryContent appState={appState} models={ptoModels} runtime={runtime} navigation={navigation} />;
  }

  return <PtoStaticPrimaryContent appState={appState} models={ptoModels} navigation={navigation} />;
}
