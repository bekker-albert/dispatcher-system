import type { AiAssistantRole } from "./roles";
import type { AiAssistantConnectorKey } from "./integrations";

export type AiAssistantAuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  role: AiAssistantRole;
  action: string;
  connector?: AiAssistantConnectorKey;
  target: string;
  status: "success" | "blocked" | "failed";
  summary: string;
};
