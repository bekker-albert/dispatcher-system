"use client";

import type { AppAdminContentProps } from "@/features/app/AppAdminContent";

type UseAppAdminContentPropsOptions = {
  adminSection: AppAdminContentProps["adminSection"];
  topTabs: AppAdminContentProps["navigationProps"]["topTabs"];
  customTabs: AppAdminContentProps["navigationProps"]["customTabs"];
  addCustomTab: AppAdminContentProps["navigationProps"]["onAddCustomTab"];
  updateTopTabLabel: AppAdminContentProps["navigationProps"]["onUpdateTopTabLabel"];
  updateCustomTabTitle: AppAdminContentProps["navigationProps"]["onUpdateCustomTabTitle"];
  deleteTopTab: AppAdminContentProps["navigationProps"]["onDeleteTopTab"];
  showTopTab: AppAdminContentProps["navigationProps"]["onShowTopTab"];
  deleteCustomTab: AppAdminContentProps["navigationProps"]["onDeleteCustomTab"];
  showCustomTab: AppAdminContentProps["navigationProps"]["onShowCustomTab"];
  structureSection: AppAdminContentProps["structureProps"]["structureSection"];
  setStructureSection: AppAdminContentProps["structureProps"]["onSelectStructureSection"];
  dependencyNodes: AppAdminContentProps["structureProps"]["dependencyNodes"];
  dependencyLinks: AppAdminContentProps["structureProps"]["dependencyLinks"];
  dependencyNodeForm: AppAdminContentProps["structureProps"]["dependencyNodeForm"];
  dependencyLinkForm: AppAdminContentProps["structureProps"]["dependencyLinkForm"];
  editingDependencyNodeId: AppAdminContentProps["structureProps"]["editingDependencyNodeId"];
  editingDependencyLinkId: AppAdminContentProps["structureProps"]["editingDependencyLinkId"];
  setEditingDependencyNodeId: AppAdminContentProps["structureProps"]["onEditDependencyNode"];
  setEditingDependencyLinkId: AppAdminContentProps["structureProps"]["onEditDependencyLink"];
  updateDependencyNode: AppAdminContentProps["structureProps"]["onUpdateDependencyNode"];
  updateDependencyNodeForm: AppAdminContentProps["structureProps"]["onUpdateDependencyNodeForm"];
  addDependencyNode: AppAdminContentProps["structureProps"]["onAddDependencyNode"];
  deleteDependencyNode: AppAdminContentProps["structureProps"]["onDeleteDependencyNode"];
  updateDependencyLink: AppAdminContentProps["structureProps"]["onUpdateDependencyLink"];
  updateDependencyLinkForm: AppAdminContentProps["structureProps"]["onUpdateDependencyLinkForm"];
  addDependencyLink: AppAdminContentProps["structureProps"]["onAddDependencyLink"];
  deleteDependencyLink: AppAdminContentProps["structureProps"]["onDeleteDependencyLink"];
  orgMembers: AppAdminContentProps["structureProps"]["orgMembers"];
  orgMemberForm: AppAdminContentProps["structureProps"]["orgMemberForm"];
  editingOrgMemberId: AppAdminContentProps["structureProps"]["editingOrgMemberId"];
  setEditingOrgMemberId: AppAdminContentProps["structureProps"]["onEditOrgMember"];
  updateOrgMember: AppAdminContentProps["structureProps"]["onUpdateOrgMember"];
  updateOrgMemberForm: AppAdminContentProps["structureProps"]["onUpdateOrgMemberForm"];
  addOrgMember: AppAdminContentProps["structureProps"]["onAddOrgMember"];
  deleteOrgMember: AppAdminContentProps["structureProps"]["onDeleteOrgMember"];
  areaShiftScheduleAreas: AppAdminContentProps["structureProps"]["areaShiftScheduleAreas"];
  areaShiftCutoffs: AppAdminContentProps["structureProps"]["areaShiftCutoffs"];
  updateAreaShiftCutoff: AppAdminContentProps["structureProps"]["onUpdateAreaShiftCutoff"];
  adminVehiclesProps: AppAdminContentProps["vehiclesProps"];
  adminDatabaseProps: AppAdminContentProps["databaseProps"];
  adminReportsProps: AppAdminContentProps["reportsProps"];
  adminLogs: AppAdminContentProps["logsProps"]["logs"];
  lastChangeLog: AppAdminContentProps["logsProps"]["lastChangeLog"];
  lastUploadLog: AppAdminContentProps["logsProps"]["lastUploadLog"];
  clearAdminLogs: AppAdminContentProps["logsProps"]["onClearLogs"];
};

export function useAppAdminContentProps({
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
  areaShiftCutoffs,
  updateAreaShiftCutoff,
  adminVehiclesProps,
  adminDatabaseProps,
  adminReportsProps,
  adminLogs,
  lastChangeLog,
  lastUploadLog,
  clearAdminLogs,
}: UseAppAdminContentPropsOptions): AppAdminContentProps {
  return {
    adminSection,
    navigationProps: {
      topTabs,
      customTabs,
      onAddCustomTab: addCustomTab,
      onUpdateTopTabLabel: updateTopTabLabel,
      onUpdateCustomTabTitle: updateCustomTabTitle,
      onDeleteTopTab: deleteTopTab,
      onShowTopTab: showTopTab,
      onDeleteCustomTab: deleteCustomTab,
      onShowCustomTab: showCustomTab,
    },
    structureProps: {
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
    },
    vehiclesProps: adminVehiclesProps,
    databaseProps: adminDatabaseProps,
    logsProps: {
      logs: adminLogs,
      lastChangeLog,
      lastUploadLog,
      onClearLogs: clearAdminLogs,
    },
    reportsProps: adminReportsProps,
  };
}
