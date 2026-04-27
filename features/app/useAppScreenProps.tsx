"use client";

import type { ComponentProps } from "react";

import { AppPrimaryContent } from "@/features/app/AppPrimaryContent";
import { useAppAdminScreenProps } from "@/features/app/useAppAdminScreenProps";
import type { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import { useAppDispatchScreenProps } from "@/features/app/useAppDispatchScreenProps";
import { useAppHeaderProps } from "@/features/app/useAppHeaderProps";
import type { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import type { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import { useAppPtoScreenProps } from "@/features/app/useAppPtoScreenProps";
import type { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import { useAppReportsScreenProps } from "@/features/app/useAppReportsScreenProps";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import type { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";
import { databaseConfigured } from "@/lib/data/config";
import { defaultUserCard } from "@/lib/domain/reference/defaults";
import { AppHeader } from "@/components/layout/AppHeader";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
type AppPtoDateViewport = ReturnType<typeof useAppPtoDateViewport>;
type AppAdminReportEditors = ReturnType<typeof useAppAdminReportEditors>;
type AppPtoDateEditing = ReturnType<typeof useAppPtoDateEditing>;
type AppVehicleEditing = ReturnType<typeof useAppVehicleEditing>;
type AppPtoSupplementalTables = ReturnType<typeof useAppPtoSupplementalTables>;

type UseAppScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
  ptoDateViewport: AppPtoDateViewport;
  adminReportEditors: AppAdminReportEditors;
  ptoDateEditing: AppPtoDateEditing;
  vehicleEditing: AppVehicleEditing;
  ptoSupplementalTables: AppPtoSupplementalTables;
};

type UseAppScreenPropsResult = {
  appHeaderProps: ComponentProps<typeof AppHeader>;
  primaryContentProps: ComponentProps<typeof AppPrimaryContent>;
};

export function useAppScreenProps({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  adminReportEditors,
  ptoDateEditing,
  vehicleEditing,
  ptoSupplementalTables,
}: UseAppScreenPropsArgs): UseAppScreenPropsResult {
  const {
    topTab,
    topTabs,
    subTabs,
    customTabs,
    deleteCustomTab,
    dispatchTab,
    setDispatchTab,
    fleetTab,
    setFleetTab,
    contractorTab,
    setContractorTab,
    fuelTab,
    setFuelTab,
    ptoTab,
    tbTab,
    setTbTab,
    adminSection,
    setAdminSection,
    reportCustomerId,
    setReportCustomerId,
    reportCustomers,
    reportDate,
    selectReportDate,
    ptoDatabaseMessage,
    ptoDatabaseReady,
    selectTopTab,
    selectPtoTab,
  } = appState;

  const {
    renderedTopTab,
    filteredFleet,
  } = models;

  const {
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    headerHasSubtabs,
    headerSubtabsOffset,
    activeCustomTab,
  } = navigation;

  const ptoSectionProps = useAppPtoScreenProps({
    appState,
    models,
    runtime,
    navigation,
    ptoDateViewport,
    ptoDateEditing,
    ptoSupplementalTables,
  });

  const reportsSectionProps = useAppReportsScreenProps({
    appState,
    models,
    runtime,
  });

  const dispatchSectionProps = useAppDispatchScreenProps({
    appState,
    models,
    navigation,
  });

  const adminContent = useAppAdminScreenProps({
    appState,
    models,
    adminReportEditors,
    vehicleEditing,
  });

  const appHeaderProps = useAppHeaderProps({
    topTabs,
    customTabs,
    topTab,
    subTabs,
    headerHasSubtabs,
    headerSubtabsOffset,
    headerNavRef,
    activeHeaderTabRef,
    headerSubtabsRef,
    reportCustomers,
    reportCustomerId,
    dispatchTab,
    ptoTab,
    adminSection,
    reportDate,
    selectTopTab,
    deleteCustomTab,
    setReportCustomerId,
    setDispatchTab,
    selectPtoTab,
    setAdminSection,
    selectReportDate,
  });

  return {
    appHeaderProps,
    primaryContentProps: {
      renderedTopTab,
      shouldGatePtoDatabase: databaseConfigured && !ptoDatabaseReady,
      ptoDatabaseMessage,
      reportsProps: reportsSectionProps,
      dispatchProps: dispatchSectionProps,
      fleetProps: {
        fleetTab,
        subTabs: subTabs.fleet,
        rows: filteredFleet,
        onSelectTab: setFleetTab,
      },
      contractorsProps: {
        contractorTab,
        subTabs: subTabs.contractors,
        onSelectTab: setContractorTab,
      },
      fuelProps: {
        fuelTab,
        subTabs: subTabs.fuel,
        onSelectTab: setFuelTab,
      },
      ptoProps: ptoSectionProps,
      safetyProps: {
        tbTab,
        subTabs: subTabs.tb,
        onSelectTab: setTbTab,
      },
      userProfileProps: { userCard: defaultUserCard },
      adminContent,
      customTabProps: activeCustomTab ? { tab: activeCustomTab } : null,
    },
  };
}
