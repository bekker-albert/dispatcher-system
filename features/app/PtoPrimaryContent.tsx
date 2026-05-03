"use client";

import dynamic from "next/dynamic";
import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { createEmptyPtoDateModel } from "@/features/app/emptyPtoDateModel";
import type { AppPtoModels } from "@/features/app/appPtoScreenPropsTypes";
import { isPtoDateTableKey } from "@/lib/domain/pto/date-table";
import { isPtoMatrixTableKey } from "@/lib/domain/pto/tabs";

type PtoPrimaryContentProps = Pick<AppPrimaryContentProps, "appState" | "models" | "runtime" | "navigation">;

const PtoDataPrimaryContent = dynamic(
  () => import("@/features/app/PtoDataPrimaryContent")
    .then((module) => module.PtoDataPrimaryContent),
  { ssr: false },
);

const PtoStaticPrimaryContent = dynamic(
  () => import("@/features/app/PtoStaticPrimaryContent")
    .then((module) => module.PtoStaticPrimaryContent),
  { ssr: false },
);

export function PtoPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoPrimaryContentProps) {
  const isPtoDateTab = isPtoDateTableKey(appState.ptoTab);
  const isPtoBucketsSection = isPtoMatrixTableKey(appState.ptoTab);

  if (!isPtoDateTab && !isPtoBucketsSection) {
    const ptoModels: AppPtoModels = {
      ...models,
      ...createEmptyPtoDateModel(appState.ptoPlanYear),
    };

    return <PtoStaticPrimaryContent appState={appState} models={ptoModels} navigation={navigation} />;
  }

  return (
    <PtoDataPrimaryContent
      appState={appState}
      models={models}
      runtime={runtime}
      navigation={navigation}
    />
  );
}
