"use client";

import type { AppNavigation, AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { useAppPtoControllers } from "@/features/app/useAppPtoControllers";
import { useAppPtoScreenProps } from "@/features/app/useAppPtoScreenProps";
import PtoSection from "@/features/pto/PtoSection";

type PtoDatePrimaryContentProps = {
  appState: AppStateBundle;
  models: AppPtoModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};

export function PtoDatePrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: PtoDatePrimaryContentProps) {
  const {
    ptoDateViewport,
    ptoDateEditingHandlers,
    ptoSupplementalTables,
  } = useAppPtoControllers({ appState, models, runtime });
  const ptoProps = useAppPtoScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    ptoDateEditing: ptoDateEditingHandlers,
    ptoSupplementalTables,
  });

  return <PtoSection {...ptoProps} />;
}
