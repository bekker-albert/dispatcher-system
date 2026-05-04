export type AiAssistantRole =
  | "viewer"
  | "operator"
  | "supervisor"
  | "admin"
  | "security-auditor";

export type AiAssistantPermission =
  | "ai.chat.read"
  | "ai.chat.write"
  | "ai.context.dispatcher.read"
  | "ai.knowledge.read"
  | "ai.external.draft"
  | "ai.external.send"
  | "ai.calendar.read"
  | "ai.calendar.write"
  | "ai.documentolog.read"
  | "ai.documentolog.write"
  | "ai.admin.connectors"
  | "ai.audit.read";
