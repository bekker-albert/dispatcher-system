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
import { createAiAssistantRuntimeContext } from "@/lib/domain/ai-assistant/runtime-context";

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
  const activeReportCustomer = appState.reportCustomers.find((customer) => customer.id === appState.reportCustomerId);
  const aiAssistantRuntimeContext = createAiAssistantRuntimeContext({
    adminSection: appState.adminSection,
    dispatchTab: appState.dispatchTab,
    ptoTab: appState.ptoTab,
    reportCustomerLabel: activeReportCustomer?.label,
    topTab: appState.topTab,
    workDate: appState.reportDate,
  });

  return (
    <AiAssistantProvider
      currentContext={aiAssistantRuntimeContext}
      currentWorkDate={appState.reportDate}
    >
      <AppPageShell saveStatus={saveStatus} onCloseSaveStatus={hideSaveStatus}>
        <AppHeader {...appHeaderProps} />
        <AppPrimaryContent {...primaryContentProps} />
      </AppPageShell>
    </AiAssistantProvider>
  );
}
