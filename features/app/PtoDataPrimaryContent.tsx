"use client";

import dynamic from "next/dynamic";
import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { useAppPtoBucketsModel } from "@/features/app/useAppPtoBucketsModel";
import { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import { createEmptyPtoDateModel } from "@/features/app/emptyPtoDateModel";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { usePtoDateEditingReset } from "@/features/pto/usePtoDateEditingReset";
import { isPtoDateTableKey } from "@/lib/domain/pto/date-table";

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
  const isPtoDateTab = isPtoDateTableKey(appState.ptoTab);
  const isPtoBucketsSection = appState.ptoTab === "buckets";

  usePtoDateEditingReset({
    active: models.renderedTopTab === "pto" && isPtoDateTab,
    setPtoDateEditing: appState.setPtoDateEditing,
    setDraggedPtoRowId: appState.setDraggedPtoRowId,
    setPtoDropTarget: appState.setPtoDropTarget,
    setPtoFormulaCell: appState.setPtoFormulaCell,
    setPtoInlineEditCell: appState.setPtoInlineEditCell,
    setPtoSelectedCellKeys: appState.setPtoSelectedCellKeys,
  });

  if (isPtoDateTab) {
    return <PtoDateDataPrimaryContent appState={appState} models={models} runtime={runtime} navigation={navigation} />;
  }

  if (isPtoBucketsSection) {
    return <PtoBucketsDataPrimaryContent appState={appState} models={models} runtime={runtime} navigation={navigation} />;
  }

  const ptoModels: AppPtoModels = {
    ...models,
    ...createEmptyPtoDateModel(appState.ptoPlanYear),
  };

  return <PtoStaticPrimaryContent appState={appState} models={ptoModels} navigation={navigation} />;
}

function PtoDateDataPrimaryContent({
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
    ptoBucketManualRows: appState.ptoBucketManualRows,
  });
  const ptoModels: AppPtoModels = { ...models, ...ptoDateModel };

  return <PtoDatePrimaryContent appState={appState} models={ptoModels} runtime={runtime} navigation={navigation} />;
}

function PtoBucketsDataPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoDataPrimaryContentProps) {
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
