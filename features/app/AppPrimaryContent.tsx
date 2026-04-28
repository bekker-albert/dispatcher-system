"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import {
  AdminPrimaryContent,
  ContractorsPrimaryContent,
  CustomTabPrimaryContent,
  DispatchPrimaryContent,
  FleetPrimaryContent,
  FuelPrimaryContent,
  PtoPrimaryContent,
  ReportsPrimaryContent,
  SafetyPrimaryContent,
  UserPrimaryContent,
} from "@/features/app/lazyPrimaryContent";
import { useAppSectionPreloader } from "@/features/app/useAppSectionPreloader";
import { PtoDatabaseGate } from "@/features/pto/PtoDatabaseGate";
import { databaseConfigured } from "@/lib/data/config";

export function AppPrimaryContent({
  appState,
  models,
  runtime,
  navigation,
}: AppPrimaryContentProps) {
  const {
    fleetTab,
    setFleetTab,
    contractorTab,
    setContractorTab,
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
    filteredFleet,
  } = models;

  useAppSectionPreloader(!databaseConfigured || ptoDatabaseReady);

  const shouldGatePtoDatabase = databaseConfigured && !ptoDatabaseReady;
  const shouldShowPtoDatabaseGateOnly = shouldGatePtoDatabase
    && (renderedTopTab === "reports" || renderedTopTab === "pto");

  if (shouldShowPtoDatabaseGateOnly) {
    return <PtoDatabaseGate message={ptoDatabaseMessage} />;
  }

  return (
    <>
      {renderedTopTab === "reports" && (
        <ReportsPrimaryContent appState={appState} models={models} runtime={runtime} />
      )}

      {renderedTopTab === "dispatch" && (
        <DispatchPrimaryContent appState={appState} models={models} navigation={navigation} />
      )}

      {renderedTopTab === "fleet" && (
        <FleetPrimaryContent
          fleetTab={fleetTab}
          subTabs={subTabs.fleet}
          rows={filteredFleet}
          onSelectTab={setFleetTab}
        />
      )}

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
        <SafetyPrimaryContent tbTab={tbTab} subTabs={subTabs.tb} onSelectTab={setTbTab} />
      )}

      {renderedTopTab === "user" && <UserPrimaryContent />}

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
