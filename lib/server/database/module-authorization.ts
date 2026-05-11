import {
  canAuthUserEditTab,
  canAuthUserViewTab,
  isAuthUserSuperuser,
  type AuthUser,
} from "../../domain/auth/types";
import type { AccessCapability } from "../../domain/access-control/accessMatrix";
import {
  createModuleDatabaseAuthorizationContext,
  type ModuleDatabaseAuthorizationRequest,
  type ModuleDatabaseAuthorizationContext,
} from "../../domain/data-access/moduleDatabaseAuthorization";
import type { BaseTopTab } from "../../domain/navigation/tabs";
import type { DispatchWorkspaceId } from "../../domain/workspaces/workspaces";

export type ModuleDatabaseAuthorizationDecisionReason =
  | "not_module_database_action"
  | "missing_section_scope"
  | "superuser"
  | "current_tab_permission_granted"
  | "current_tab_permission_denied";

export type ModuleDatabaseAuthorizationDecision = {
  appliesToModuleAction: boolean;
  allowed: boolean;
  reason: ModuleDatabaseAuthorizationDecisionReason;
  tabId?: BaseTopTab;
  context?: ModuleDatabaseAuthorizationContext;
};

export const workspaceCurrentTabFallbacks: Record<DispatchWorkspaceId, BaseTopTab> = {
  home: "home",
  "mining-dispatch": "dispatch",
  taxation: "fuel",
  "smts-gps": "tb",
  fleet: "fleet",
  "common-processes": "common",
  reports: "reports",
  admin: "admin",
  "ai-assistant": "ai-assistant",
};

function capabilityRequiresEdit(capability: AccessCapability) {
  return capability === "edit"
    || capability === "approve"
    || capability === "delete"
    || capability === "admin";
}

export function getCurrentTabFallbackForWorkspace(workspaceId: DispatchWorkspaceId) {
  return workspaceCurrentTabFallbacks[workspaceId];
}

export function canCurrentAuthUserUseModuleCapability(
  user: AuthUser,
  tabId: BaseTopTab,
  capability: AccessCapability,
) {
  if (isAuthUserSuperuser(user)) return true;

  return capabilityRequiresEdit(capability)
    ? canAuthUserEditTab(user, tabId)
    : canAuthUserViewTab(user, tabId);
}

export function authorizeModuleDatabaseRequestWithCurrentTabs(
  user: AuthUser,
  request: ModuleDatabaseAuthorizationRequest,
): ModuleDatabaseAuthorizationDecision {
  const context = createModuleDatabaseAuthorizationContext(request);
  if (!context) {
    return {
      appliesToModuleAction: false,
      allowed: true,
      reason: "not_module_database_action",
    };
  }

  if (context.missingSectionScope) {
    return {
      appliesToModuleAction: true,
      allowed: false,
      reason: "missing_section_scope",
      tabId: getCurrentTabFallbackForWorkspace(context.requirement.workspaceId),
      context,
    };
  }

  if (isAuthUserSuperuser(user)) {
    return {
      appliesToModuleAction: true,
      allowed: true,
      reason: "superuser",
      tabId: getCurrentTabFallbackForWorkspace(context.requirement.workspaceId),
      context,
    };
  }

  const tabId = getCurrentTabFallbackForWorkspace(context.requirement.workspaceId);
  const allowed = canCurrentAuthUserUseModuleCapability(
    user,
    tabId,
    context.requirement.requiredCapability,
  );

  return {
    appliesToModuleAction: true,
    allowed,
    reason: allowed ? "current_tab_permission_granted" : "current_tab_permission_denied",
    tabId,
    context,
  };
}
