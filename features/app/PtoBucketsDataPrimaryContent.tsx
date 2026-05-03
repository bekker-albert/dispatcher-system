"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { PtoBucketsPrimaryContent } from "@/features/app/PtoBucketsPrimaryContent";
import { useAppPtoBucketsModel } from "@/features/app/useAppPtoBucketsModel";

type PtoBucketsDataPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime" | "navigation">;

export function PtoBucketsDataPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoBucketsDataPrimaryContentProps) {
  const ptoBucketsModel = useAppPtoBucketsModel({
    renderedTopTab: models.renderedTopTab,
    ptoTab: appState.ptoTab,
    ptoPlanYear: appState.ptoPlanYear,
    deferredPtoPlanRows: models.deferredPtoPlanRows,
    deferredPtoOperRows: models.deferredPtoOperRows,
    deferredPtoSurveyRows: models.deferredPtoSurveyRows,
    ptoBucketManualRows: appState.ptoBucketManualRows,
  });
  const ptoModels: AppPtoModels = { ...models, ...ptoBucketsModel };

  return <PtoBucketsPrimaryContent appState={appState} models={ptoModels} runtime={runtime} navigation={navigation} />;
}
