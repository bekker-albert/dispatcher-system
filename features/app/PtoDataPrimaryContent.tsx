"use client";

import dynamic from "next/dynamic";
import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { createEmptyPtoDateModel } from "@/features/app/emptyPtoDateModel";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { usePtoDateEditingReset } from "@/features/pto/usePtoDateEditingReset";
import { isPtoDateTableKey } from "@/lib/domain/pto/date-table";
import { isPtoMatrixTableKey } from "@/lib/domain/pto/tabs";

type PtoDataPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime" | "navigation">;

const PtoDateDataPrimaryContent = dynamic(
  () => import("@/features/app/PtoDateDataPrimaryContent")
    .then((module) => module.PtoDateDataPrimaryContent),
  { ssr: false },
);

const PtoBucketsDataPrimaryContent = dynamic(
  () => import("@/features/app/PtoBucketsDataPrimaryContent")
    .then((module) => module.PtoBucketsDataPrimaryContent),
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
  const isPtoBucketsSection = isPtoMatrixTableKey(appState.ptoTab);

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
