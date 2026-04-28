"use client";

import type { ReactNode } from "react";

import { useAppAdminDatabaseScreenProps } from "@/features/app/useAppAdminDatabaseScreenProps";
import { AdminReportsPrimaryContent } from "@/features/app/useAppAdminReportsPrimaryContent";
import { AdminVehiclesPrimaryContent } from "@/features/app/AdminVehiclesPrimaryContent";
import {
  buildAppAdminLogsProps,
  buildAppAdminNavigationProps,
  buildAppAdminStructureProps,
} from "@/features/app/useAppAdminSectionProps";
import { useAppAdminStructureScheduleModel } from "@/features/app/useAppAdminStructureScheduleModel";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import {
  AdminAiSection,
  AdminDatabaseSection,
  AdminLogsSection,
  AdminNavigationSection,
  AdminStructureSection,
} from "@/features/app/lazySections";
import { SectionCard } from "@/shared/ui/layout";

type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;

type UseAppAdminScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
};

export function useAppAdminScreenProps({
  appState,
  models,
  runtime,
}: UseAppAdminScreenPropsArgs): ReactNode {
  const { adminSection } = appState;

  const structureScheduleModel = useAppAdminStructureScheduleModel({
    appState,
    models,
  });

  const adminNavigationProps = buildAppAdminNavigationProps(appState);
  const adminStructureProps = buildAppAdminStructureProps({
    appState,
    areaShiftScheduleAreas: structureScheduleModel.areaShiftScheduleAreas,
  });
  const adminDatabaseProps = useAppAdminDatabaseScreenProps({
    active: adminSection === "database",
    appState,
  });

  const adminLogsProps = buildAppAdminLogsProps(appState);

  return (
    <SectionCard title="">
      {adminSection === "navigation" && (
        <AdminNavigationSection {...adminNavigationProps} />
      )}
      {adminSection === "structure" && (
        <AdminStructureSection {...adminStructureProps} />
      )}
      {adminSection === "ai" && <AdminAiSection />}
      {adminSection === "vehicles" && (
        <AdminVehiclesPrimaryContent appState={appState} models={models} runtime={runtime} />
      )}
      {adminSection === "database" && <AdminDatabaseSection {...adminDatabaseProps} />}
      {adminSection === "logs" && (
        <AdminLogsSection {...adminLogsProps} />
      )}
      {adminSection === "reports" && (
        <AdminReportsPrimaryContent appState={appState} models={models} />
      )}
    </SectionCard>
  );
}
