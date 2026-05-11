import type { TopTab } from "../navigation/tabs";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import { dispatchServiceWorkspaces } from "../workspaces/workspaces";

export type AccessCapability = "view" | "edit" | "approve" | "delete" | "export" | "admin";

export type DispatchServiceRoleId =
  | "dispatch-chief"
  | "mining-dispatcher"
  | "mining-master"
  | "section-chief"
  | "taxation-dispatcher"
  | "senior-taxation-dispatcher"
  | "smts-admin"
  | "smts-installer"
  | "safety-specialist"
  | "system-admin"
  | "contractor";

export type AccessMatrixGrant = {
  id: string;
  userId?: string;
  roleId?: DispatchServiceRoleId;
  sectionId?: string;
  workspaceId: DispatchWorkspaceId;
  moduleId?: string;
  tabId?: TopTab;
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
  canAdmin: boolean;
  reason?: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
};

export type WorkspaceAccessMatrixPreviewRow = {
  workspaceId: DispatchWorkspaceId;
  title: string;
  topTab: TopTab;
  defaultViewRoles: DispatchServiceRoleId[];
  defaultEditRoles: DispatchServiceRoleId[];
  controlledBySection: boolean;
  requiredServerFilters: string[];
};

export const accessCapabilityLabels: Record<AccessCapability, string> = {
  view: "Просмотр",
  edit: "Редактирование",
  approve: "Согласование",
  delete: "Удаление",
  export: "Экспорт",
  admin: "Администрирование",
};

export const dispatchServiceRoleLabels: Record<DispatchServiceRoleId, string> = {
  "dispatch-chief": "Начальник диспетчерской службы",
  "mining-dispatcher": "Горный диспетчер",
  "mining-master": "Горный мастер",
  "section-chief": "Начальник участка",
  "taxation-dispatcher": "Диспетчер-таксировщик",
  "senior-taxation-dispatcher": "Старший диспетчер-таксировщик",
  "smts-admin": "Технический администратор СМТС",
  "smts-installer": "Монтажник СМТС",
  "safety-specialist": "Специалист ТБ",
  "system-admin": "Администратор системы",
  contractor: "Подрядчик с ограниченным доступом",
};

export const dispatchServiceRoles = Object.entries(dispatchServiceRoleLabels).map(([id, label]) => ({
  id: id as DispatchServiceRoleId,
  label,
}));

export const workspaceAccessMatrixPreview: WorkspaceAccessMatrixPreviewRow[] = dispatchServiceWorkspaces.map((workspace) => {
  const baseRow = {
    workspaceId: workspace.id,
    title: workspace.title,
    topTab: workspace.topTab,
    defaultViewRoles: ["dispatch-chief", "system-admin"] as DispatchServiceRoleId[],
    defaultEditRoles: ["system-admin"] as DispatchServiceRoleId[],
    controlledBySection: true,
    requiredServerFilters: ["section_id", "status"],
  };

  if (workspace.id === "home") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "system-admin", "mining-dispatcher", "taxation-dispatcher", "smts-admin"],
      controlledBySection: false,
      requiredServerFilters: [],
    };
  }

  if (workspace.id === "mining-dispatch") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "mining-dispatcher", "mining-master", "section-chief"],
      defaultEditRoles: ["mining-dispatcher", "mining-master"],
      requiredServerFilters: ["date", "section_id", "shift", "status"],
    };
  }

  if (workspace.id === "taxation") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "taxation-dispatcher", "senior-taxation-dispatcher", "section-chief"],
      defaultEditRoles: ["taxation-dispatcher", "senior-taxation-dispatcher"],
      requiredServerFilters: ["date", "section_id", "shift", "driver_id", "vehicle_id", "status"],
    };
  }

  if (workspace.id === "smts-gps") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "smts-admin", "smts-installer", "safety-specialist"],
      defaultEditRoles: ["smts-admin", "smts-installer"],
      requiredServerFilters: ["section_id", "vehicle_id", "terminal_id", "status"],
    };
  }

  if (workspace.id === "fleet") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "system-admin", "mining-dispatcher", "taxation-dispatcher", "smts-admin"],
      defaultEditRoles: ["system-admin"],
      requiredServerFilters: ["section_id", "vehicle_id", "status"],
    };
  }

  if (workspace.id === "admin") {
    return {
      ...baseRow,
      defaultViewRoles: ["dispatch-chief", "system-admin"],
      defaultEditRoles: ["system-admin"],
      controlledBySection: false,
      requiredServerFilters: ["user_id", "role_id", "section_id"],
    };
  }

  return baseRow;
});
