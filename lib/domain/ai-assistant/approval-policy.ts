import type {
  AiAssistantActionRisk,
  AiAssistantActionType,
  AiAssistantConnectorKey,
} from "./types";

const alwaysApprovalActions = new Set<AiAssistantActionType>([
  "send-whatsapp",
  "send-mail",
  "start-documentolog",
  "update-knowledge-rule",
  "create-business-trip",
  "delete-data",
]);

export function requiresAiAssistantApproval(
  actionType: AiAssistantActionType,
  risk: AiAssistantActionRisk,
  connector?: AiAssistantConnectorKey | string,
): boolean {
  if (risk === "critical") return true;
  if (alwaysApprovalActions.has(actionType)) return true;
  if (actionType === "create-calendar-event" && connector === "calendar") return true;
  if (actionType === "prepare-document" && connector === "documentolog") return true;

  return false;
}
