import type { AiAssistantRole, AiAssistantPermission } from "./roles";
import type { AiAssistantActionType } from "./tasks";

export type AiAssistantConnectorKey =
  | "ai-api"
  | "whatsapp"
  | "documentolog"
  | "mail"
  | "calendar"
  | "push"
  | "knowledge-base";

export type AiAssistantConnectorStatus =
  | "planned"
  | "disabled"
  | "connected"
  | "error";

export type AiAssistantIntegration = {
  key: string;
  title: string;
  status: AiAssistantConnectorStatus;
  mode: "read" | "write" | "read-write";
  description: string;
  requiredScopes: AiAssistantPermission[];
  availableCapabilities?: string[];
  stubNotes?: string;
  nextStep?: string;
  usedByAgentIds?: string[];
  lastSyncAt?: string;
};

export type AiAssistantConnectorContext = {
  actorUserId: string;
  role: AiAssistantRole;
  scopes: AiAssistantPermission[];
  correlationId: string;
  dryRun: boolean;
};

export type AiAssistantConnectorResult<TData> = {
  ok: boolean;
  data?: TData;
  errorCode?: string;
  auditId: string;
};

export type AiAssistantConnectorExecuteInput = {
  actionType: AiAssistantActionType;
  approvalActionId?: string;
  approved: boolean;
  idempotencyKey: string;
  target: string;
  body: string;
};

export type AiAssistantConnectorCapability =
  | "read"
  | "draft"
  | "approve"
  | "send"
  | "sync"
  | "search";

export type AiAssistantConnector = {
  key: AiAssistantConnectorKey;
  title: string;
  capabilities: AiAssistantConnectorCapability[];
  requiredScopes: AiAssistantPermission[];
  createDraft?: (
    context: AiAssistantConnectorContext,
    input: { title: string; body: string; target: string },
  ) => Promise<AiAssistantConnectorResult<{ draftId: string }>>;
  sync?: (
    context: AiAssistantConnectorContext,
  ) => Promise<AiAssistantConnectorResult<{ syncedAt: string }>>;
  execute?: (
    context: AiAssistantConnectorContext,
    input: AiAssistantConnectorExecuteInput,
  ) => Promise<AiAssistantConnectorResult<{ executionId: string }>>;
};
