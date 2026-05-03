"use client";

import type { AppNavigation, AppPtoModels, AppRuntimeControllers } from "@/features/app/appPtoScreenPropsTypes";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { noopPtoDateEditing } from "@/features/app/noopPtoDateEditing";
import { useAppPtoControllers } from "@/features/app/useAppPtoControllers";
import { useAppPtoDateEditingController } from "@/features/app/useAppPtoDateEditingController";
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
    ptoSupplementalTables,
  } = useAppPtoControllers({ appState, models, runtime });

  if (appState.ptoDateEditing) {
    return (
      <PtoDateEditingPrimaryContent
        appState={appState}
        models={models}
        runtime={runtime}
        navigation={navigation}
        ptoDateViewport={ptoDateViewport}
        ptoSupplementalTables={ptoSupplementalTables}
      />
    );
  }

  return (
    <PtoDateReadonlyPrimaryContent
      appState={appState}
      models={models}
      runtime={runtime}
      navigation={navigation}
      ptoDateViewport={ptoDateViewport}
      ptoSupplementalTables={ptoSupplementalTables}
    />
  );
}

type PtoDatePrimaryContentShellProps = PtoDatePrimaryContentProps & ReturnType<typeof useAppPtoControllers>;

function PtoDateReadonlyPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  ptoSupplementalTables,
}: PtoDatePrimaryContentShellProps) {
  const ptoProps = useAppPtoScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    ptoDateEditing: noopPtoDateEditing,
    ptoSupplementalTables,
  });

  return <PtoSection {...ptoProps} />;
}

function PtoDateEditingPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  ptoSupplementalTables,
}: PtoDatePrimaryContentShellProps) {
  const ptoDateEditing = useAppPtoDateEditingController({ appState, models, runtime });
  const ptoProps = useAppPtoScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    ptoDateEditing,
    ptoSupplementalTables,
  });

  return <PtoSection {...ptoProps} />;
}
