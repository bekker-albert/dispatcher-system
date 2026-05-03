"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppNavigationControllers } from "@/features/app/useAppNavigationControllers";
import { AppPageShell } from "@/features/app/AppPageShell";
import { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import { useAppScreenProps } from "@/features/app/useAppScreenProps";
import { useAppStateBundle } from "@/features/app/useAppStateBundle";
import { AiAssistantProvider } from "@/features/ai-assistant/lib/useAiAssistantState";
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
  } = useAppNavigationControllers({ appState, models });

  const {
    appHeaderProps,
    primaryContentProps,
  } = useAppScreenProps({
    appState,
    models,
    runtime,
    navigation,
  });

  return (
    <AiAssistantProvider>
      <AppPageShell saveStatus={saveStatus} onCloseSaveStatus={hideSaveStatus}>
        <AppHeader {...appHeaderProps} />
        <AppPrimaryContent {...primaryContentProps} />
      </AppPageShell>
    </AiAssistantProvider>
  );
}
