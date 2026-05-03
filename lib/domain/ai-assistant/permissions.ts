import type { AiAssistantPermission, AiAssistantRole } from "./types";

const permissionsByRole: Record<AiAssistantRole, AiAssistantPermission[]> = {
  viewer: [
    "ai.chat.read",
    "ai.knowledge.read",
  ],
  operator: [
    "ai.chat.read",
    "ai.chat.write",
    "ai.context.dispatcher.read",
    "ai.knowledge.read",
    "ai.external.draft",
    "ai.calendar.read",
    "ai.documentolog.read",
  ],
  supervisor: [
    "ai.chat.read",
    "ai.chat.write",
    "ai.context.dispatcher.read",
    "ai.knowledge.read",
    "ai.external.draft",
    "ai.external.send",
    "ai.calendar.read",
    "ai.calendar.write",
    "ai.documentolog.read",
    "ai.documentolog.write",
    "ai.audit.read",
  ],
  admin: [
    "ai.chat.read",
    "ai.chat.write",
    "ai.context.dispatcher.read",
    "ai.knowledge.read",
    "ai.external.draft",
    "ai.external.send",
    "ai.calendar.read",
    "ai.calendar.write",
    "ai.documentolog.read",
    "ai.documentolog.write",
    "ai.admin.connectors",
    "ai.audit.read",
  ],
  "security-auditor": [
    "ai.chat.read",
    "ai.knowledge.read",
    "ai.audit.read",
  ],
};

export function resolveAiAssistantPermissions(role: AiAssistantRole): AiAssistantPermission[] {
  return permissionsByRole[role];
}

export function hasAiAssistantPermission(
  role: AiAssistantRole,
  permission: AiAssistantPermission,
) {
  return permissionsByRole[role].includes(permission);
}

export function canUseAiAssistant(role: AiAssistantRole) {
  return hasAiAssistantPermission(role, "ai.chat.read");
}

export function canApproveAiAssistantAction(role: AiAssistantRole) {
  return hasAiAssistantPermission(role, "ai.external.send")
    || hasAiAssistantPermission(role, "ai.documentolog.write")
    || hasAiAssistantPermission(role, "ai.calendar.write");
}

export function canManageAiAssistantConnectors(role: AiAssistantRole) {
  return hasAiAssistantPermission(role, "ai.admin.connectors");
}
