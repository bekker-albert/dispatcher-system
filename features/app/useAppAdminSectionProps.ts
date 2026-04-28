"use client";

import type { ComponentProps } from "react";

import type { AdminStructureSection } from "@/features/admin/structure/AdminStructureSection";
import type { AdminLogsSection, AdminNavigationSection } from "@/features/app/lazySections";
import type { useAppReportBaseRowsModel } from "@/features/app/useAppReportBaseRowsModel";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

type StructureScheduleModel = ReturnType<typeof useAppReportBaseRowsModel>;

export function buildAppAdminNavigationProps(
  appState: AppStateBundle,
): ComponentProps<typeof AdminNavigationSection> {
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
  } = appState;

  return {
    topTabs,
    customTabs,
    onAddCustomTab: addCustomTab,
    onUpdateTopTabLabel: updateTopTabLabel,
    onUpdateCustomTabTitle: updateCustomTabTitle,
    onDeleteTopTab: deleteTopTab,
    onShowTopTab: showTopTab,
    onDeleteCustomTab: deleteCustomTab,
    onShowCustomTab: showCustomTab,
  };
}

type BuildAppAdminStructurePropsArgs = {
  appState: AppStateBundle;
  areaShiftScheduleAreas: StructureScheduleModel["areaShiftScheduleAreas"];
};

export function buildAppAdminStructureProps({
  appState,
  areaShiftScheduleAreas,
}: BuildAppAdminStructurePropsArgs): ComponentProps<typeof AdminStructureSection> {
  const {
    structureSection,
    setStructureSection,
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
    areaShiftCutoffs,
  } = appState;

  return {
    structureSection,
    onSelectStructureSection: setStructureSection,
    dependencyNodes,
    dependencyLinks,
    dependencyNodeForm,
    dependencyLinkForm,
    editingDependencyNodeId,
    editingDependencyLinkId,
    onEditDependencyNode: setEditingDependencyNodeId,
    onEditDependencyLink: setEditingDependencyLinkId,
    onUpdateDependencyNode: updateDependencyNode,
    onUpdateDependencyNodeForm: updateDependencyNodeForm,
    onAddDependencyNode: addDependencyNode,
    onDeleteDependencyNode: deleteDependencyNode,
    onUpdateDependencyLink: updateDependencyLink,
    onUpdateDependencyLinkForm: updateDependencyLinkForm,
    onAddDependencyLink: addDependencyLink,
    onDeleteDependencyLink: deleteDependencyLink,
    orgMembers,
    orgMemberForm,
    editingOrgMemberId,
    onEditOrgMember: setEditingOrgMemberId,
    onUpdateOrgMember: updateOrgMember,
    onUpdateOrgMemberForm: updateOrgMemberForm,
    onAddOrgMember: addOrgMember,
    onDeleteOrgMember: deleteOrgMember,
    areaShiftScheduleAreas,
    areaShiftCutoffs,
    onUpdateAreaShiftCutoff: updateAreaShiftCutoff,
  };
}

export function buildAppAdminLogsProps(
  appState: AppStateBundle,
): ComponentProps<typeof AdminLogsSection> {
  const { adminLogs, clearAdminLogs, lastChangeLog, lastUploadLog } = appState;

  return {
    logs: adminLogs,
    lastChangeLog,
    lastUploadLog,
    onClearLogs: clearAdminLogs,
  };
}
