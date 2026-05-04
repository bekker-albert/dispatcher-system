import type { AiAssistantPermission } from "./roles";
import type { AiAssistantActionType } from "./tasks";
import type { AiAssistantConnectorKey } from "./integrations";

export type AiAssistantAgentRole =
  | "main-assistant"
  | "whatsapp-monitor"
  | "task-planner"
  | "document-agent"
  | "mail-agent"
  | "calendar-agent"
  | "documentolog-agent"
  | "mentor-agent"
  | "development-agent"
  | "qa-agent"
  | "security-agent";

export type AiAssistantAgentRuntimeStatus =
  | "planned"
  | "active"
  | "paused"
  | "error";

export type AiAssistantAgent = {
  id: string;
  title: string;
  role: AiAssistantAgentRole;
  description: string;
  status: AiAssistantAgentRuntimeStatus;
  permissions: AiAssistantPermission[];
  allowedActions: AiAssistantActionType[];
  blockedActions: AiAssistantActionType[];
  requiredConnectors: AiAssistantConnectorKey[];
  requiresUserApproval: boolean;
  updatedAt: string;
};
