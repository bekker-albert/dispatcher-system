"use client";

import type { ReactNode } from "react";

import { AppAdminContent } from "@/features/app/AppAdminContent";
import { useAppAdminContentProps } from "@/features/app/useAppAdminContentProps";
import { useAppAdminDatabaseScreenProps } from "@/features/app/useAppAdminDatabaseScreenProps";
import type { useAppAdminReportEditors } from "@/features/app/useAppAdminReportEditors";
import { useAppAdminReportsScreenProps } from "@/features/app/useAppAdminReportsScreenProps";
import { useAppAdminVehiclesScreenProps } from "@/features/app/useAppAdminVehiclesScreenProps";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppStateBundle } from "@/features/app/useAppStateBundle";
import type { useAppVehicleEditing } from "@/features/app/useAppVehicleEditing";

type AppStateBundle = ReturnType<typeof useAppStateBundle>;
type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
type AppAdminReportEditors = ReturnType<typeof useAppAdminReportEditors>;
type AppVehicleEditing = ReturnType<typeof useAppVehicleEditing>;

type UseAppAdminScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  adminReportEditors: AppAdminReportEditors;
  vehicleEditing: AppVehicleEditing;
};

export function useAppAdminScreenProps({
  appState,
  models,
  adminReportEditors,
  vehicleEditing,
}: UseAppAdminScreenPropsArgs): ReactNode {
  const {
    topTabs,
    customTabs,
    addCustomTab,
    updateTopTabLabel,
    deleteTopTab,
    showTopTab,
    updateCustomTabTitle,
    showCustomTab,
    deleteCustomTab,
    structureSection,
    setStructureSection,
    adminSection,
    orgMembers,
    orgMemberForm,
    editingOrgMemberId,
    setEditingOrgMemberId,
    updateOrgMember,
    updateOrgMemberForm,
    addOrgMember,
    deleteOrgMember,
    dependencyNodes,
    dependencyLinks,
    dependencyNodeForm,
    dependencyLinkForm,
    editingDependencyNodeId,
    setEditingDependencyNodeId,
    editingDependencyLinkId,
    setEditingDependencyLinkId,
    updateDependencyNode,
    updateDependencyNodeForm,
    addDependencyNode,
    deleteDependencyNode,
    updateDependencyLink,
    updateDependencyLinkForm,
    addDependencyLink,
    deleteDependencyLink,
    updateAreaShiftCutoff,
    adminLogs,
    clearAdminLogs,
    lastChangeLog,
    lastUploadLog,
  } = appState;

  const {
    areaShiftScheduleAreas,
  } = models;

  const adminDatabaseProps = useAppAdminDatabaseScreenProps({
    appState,
  });

  const adminVehiclesProps = useAppAdminVehiclesScreenProps({
    appState,
    models,
    vehicleEditing,
  });

  const adminReportsProps = useAppAdminReportsScreenProps({
    appState,
    models,
    adminReportEditors,
  });

  const adminContentProps = useAppAdminContentProps({
    adminSection,
    topTabs,
    customTabs,
    addCustomTab,
    updateTopTabLabel,
    updateCustomTabTitle,
    deleteTopTab,
    showTopTab,
    deleteCustomTab,
    showCustomTab,
    structureSection,
    setStructureSection,
    dependencyNodes,
    dependencyLinks,
    dependencyNodeForm,
    dependencyLinkForm,
    editingDependencyNodeId,
    editingDependencyLinkId,
    setEditingDependencyNodeId,
    setEditingDependencyLinkId,
    updateDependencyNode,
    updateDependencyNodeForm,
    addDependencyNode,
    deleteDependencyNode,
    updateDependencyLink,
    updateDependencyLinkForm,
    addDependencyLink,
    deleteDependencyLink,
    orgMembers,
    orgMemberForm,
    editingOrgMemberId,
    setEditingOrgMemberId,
    updateOrgMember,
    updateOrgMemberForm,
    addOrgMember,
    deleteOrgMember,
    areaShiftScheduleAreas,
    areaShiftCutoffs: appState.areaShiftCutoffs,
    updateAreaShiftCutoff,
    adminVehiclesProps,
    adminDatabaseProps,
    adminReportsProps,
    adminLogs,
    lastChangeLog,
    lastUploadLog,
    clearAdminLogs,
  });

  return <AppAdminContent {...adminContentProps} />;
}
