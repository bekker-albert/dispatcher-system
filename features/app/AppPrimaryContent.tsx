"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import {
  AdminPrimaryContent,
  AiAssistantPrimaryContent,
  CommonProcessesPrimaryContent,
  ContractorsPrimaryContent,
  CustomTabPrimaryContent,
  DispatchPrimaryContent,
  FleetPrimaryContent,
  FuelPrimaryContent,
  PtoPrimaryContent,
  ReportsPrimaryContent,
  SafetyPrimaryContent,
  WorkspaceOverviewPrimaryContent,
} from "@/features/app/lazyPrimaryContent";
import { useAppSectionPreloader } from "@/features/app/useAppSectionPreloader";
import { PtoDatabaseGate } from "@/features/pto/PtoDatabaseGate";
import { databaseConfigured } from "@/lib/data/config";
import { ptoTabNeedsDatabase } from "@/lib/domain/pto/tabs";

export function AppPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: AppPrimaryContentProps) {
  const {
    contractorTab,
    setContractorTab,
    fleetTab,
    fuelTab,
    setFuelTab,
    tbTab,
    setTbTab,
    subTabs,
    ptoDatabaseMessage,
    ptoDatabaseReady,
  } = appState;

  const {
    renderedTopTab,
  } = models;

  const shouldPreloadSections = renderedTopTab !== "home"
    && appState.adminDataLoaded
    && (!databaseConfigured || ptoDatabaseReady);
  useAppSectionPreloader(shouldPreloadSections, {
    activeTab: renderedTopTab,
    includePto: !databaseConfigured || ptoDatabaseReady,
  });

  const activePtoTabNeedsDatabase = ptoTabNeedsDatabase(appState.ptoTab);
  const shouldGatePtoDatabase = databaseConfigured && !ptoDatabaseReady;
  const shouldShowPtoDatabaseGateOnly = shouldGatePtoDatabase
    && renderedTopTab === "pto"
    && activePtoTabNeedsDatabase;

  if (shouldShowPtoDatabaseGateOnly) {
    return <PtoDatabaseGate message={ptoDatabaseMessage} />;
  }

  return (
    <>
      {renderedTopTab === "home" && <WorkspaceOverviewPrimaryContent />}

      {renderedTopTab === "reports" && (
        <ReportsPrimaryContent appState={appState} models={models} runtime={runtime} />
      )}

      {renderedTopTab === "dispatch" && (
        <DispatchPrimaryContent appState={appState} models={models} navigation={navigation} />
      )}

      {renderedTopTab === "fleet" && (
        <FleetPrimaryContent
          appState={appState}
          models={models}
          mode="readonly"
          fleetTab={fleetTab}
          runtime={runtime}
        />
      )}

      {renderedTopTab === "common" && <CommonProcessesPrimaryContent />}

      {renderedTopTab === "contractors" && (
        <ContractorsPrimaryContent
          contractorTab={contractorTab}
          subTabs={subTabs.contractors}
          onSelectTab={setContractorTab}
        />
      )}

      {renderedTopTab === "fuel" && (
        <FuelPrimaryContent
          fuelTab={fuelTab}
          subTabs={subTabs.fuel}
          onSelectTab={setFuelTab}
        />
      )}

      {renderedTopTab === "pto" && (
        <PtoPrimaryContent
          appState={appState}
          models={models}
          runtime={runtime}
          navigation={navigation}
        />
      )}

      {renderedTopTab === "tb" && (
        <SafetyPrimaryContent tbTab={tbTab} subTabs={subTabs.tb} vehicleRows={appState.vehicleRows} onSelectTab={setTbTab} />
      )}

      {renderedTopTab === "ai-assistant" && <AiAssistantPrimaryContent />}

      {renderedTopTab === "admin" && (
        <AdminPrimaryContent
          appState={appState}
          models={models}
          runtime={runtime}
        />
      )}

      {navigation.activeCustomTab && <CustomTabPrimaryContent tab={navigation.activeCustomTab} />}
    </>
  );
}
