"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppFeatureControllers } from "@/features/app/useAppFeatureControllers";
import { AppPageShell } from "@/features/app/AppPageShell";
import { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import { useAppScreenProps } from "@/features/app/useAppScreenProps";
import { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { databaseConfigured } from "@/lib/data/config";

export default function App() {
  const appState = useAppStateBundle();
  const {
    saveStatus,
    hideSaveStatus,
  } = appState;

  const runtime = useAppRuntimeControllers({ appState, databaseConfigured });
  const models = useAppDerivedModels({ appState });

  const {
    navigation,
    ptoDateViewport,
    adminReportEditors,
    ptoDateEditingHandlers,
    vehicleEditing,
    ptoSupplementalTables,
  } = useAppFeatureControllers({ appState, models, runtime });

  const {
    appHeaderProps,
    primaryContentProps,
  } = useAppScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    adminReportEditors,
    ptoDateEditing: ptoDateEditingHandlers,
    vehicleEditing,
    ptoSupplementalTables,
  });

  return (
    <AppPageShell saveStatus={saveStatus} onCloseSaveStatus={hideSaveStatus}>
      <AppHeader {...appHeaderProps} />
      <AppPrimaryContent {...primaryContentProps} />
    </AppPageShell>
  );
}
