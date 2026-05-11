import type { TopTab } from "../navigation/tabs";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { AccessCapability, AccessMatrixGrant, DispatchServiceRoleId } from "./accessMatrix";

export type AccessSubject = {
  userId: string;
  roleIds: readonly DispatchServiceRoleId[];
};

export type AccessScope = {
  workspaceId: DispatchWorkspaceId;
  sectionId?: string;
  moduleId?: string;
  tabId?: TopTab;
};

export type EffectiveAccessDecision = {
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
  canAdmin: boolean;
  matchedGrantIds: string[];
};

const capabilityFields = {
  view: "canView",
  edit: "canEdit",
  approve: "canApprove",
  delete: "canDelete",
  export: "canExport",
  admin: "canAdmin",
} as const satisfies Record<AccessCapability, keyof Omit<EffectiveAccessDecision, "matchedGrantIds">>;

export const createEmptyAccessDecision = (): EffectiveAccessDecision => ({
  canView: false,
  canEdit: false,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
  matchedGrantIds: [],
});

export const grantMatchesSubject = (grant: AccessMatrixGrant, subject: AccessSubject): boolean => {
  if (grant.userId && grant.userId !== subject.userId) {
    return false;
  }

  if (grant.roleId && !subject.roleIds.includes(grant.roleId)) {
    return false;
  }

  return Boolean(grant.userId || grant.roleId);
};

export const grantMatchesScope = (grant: AccessMatrixGrant, scope: AccessScope): boolean => {
  if (grant.workspaceId !== scope.workspaceId) {
    return false;
  }

  if (grant.sectionId && grant.sectionId !== scope.sectionId) {
    return false;
  }

  if (grant.moduleId && grant.moduleId !== scope.moduleId) {
    return false;
  }

  if (grant.tabId && grant.tabId !== scope.tabId) {
    return false;
  }

  return true;
};

export const getEffectiveAccess = (
  grants: readonly AccessMatrixGrant[],
  subject: AccessSubject,
  scope: AccessScope,
): EffectiveAccessDecision => {
  const decision = createEmptyAccessDecision();

  for (const grant of grants) {
    if (!grantMatchesSubject(grant, subject) || !grantMatchesScope(grant, scope)) {
      continue;
    }

    decision.matchedGrantIds.push(grant.id);
    decision.canAdmin ||= grant.canAdmin;
    decision.canView ||= grant.canView || grant.canAdmin;
    decision.canEdit ||= grant.canEdit || grant.canAdmin;
    decision.canApprove ||= grant.canApprove || grant.canAdmin;
    decision.canDelete ||= grant.canDelete || grant.canAdmin;
    decision.canExport ||= grant.canExport || grant.canAdmin;
  }

  return decision;
};

export const hasAccessCapability = (
  decision: EffectiveAccessDecision,
  capability: AccessCapability,
): boolean => decision[capabilityFields[capability]];
