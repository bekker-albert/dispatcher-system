import type {
  AiAssistantConnector,
  AiAssistantConnectorContext,
  AiAssistantConnectorExecuteInput,
  AiAssistantConnectorKey,
  AiAssistantConnectorResult,
} from "../types";

export type AiAssistantDomainConnectorConfig = Pick<
  AiAssistantConnector,
  "key" | "title" | "capabilities" | "requiredScopes"
> & {
  draftPrefix?: string;
  syncErrorCode?: string;
  executeErrorCode?: string;
};

export function createDryRunAiAssistantConnector(
  config: AiAssistantDomainConnectorConfig,
): AiAssistantConnector {
  return {
    ...config,
    async createDraft(context, input) {
      return createDryRunDraftResult(context, config.key, config.draftPrefix ?? config.key, input.target);
    },
    async sync(context) {
      return createDryRunSyncResult(context, config.syncErrorCode ?? `${config.key.toUpperCase()}_DRY_RUN_REQUIRED`);
    },
    async execute(context, input) {
      return createDryRunExecuteResult(
        context,
        config.key,
        input,
        config.executeErrorCode ?? `${config.key.toUpperCase()}_APPROVAL_REQUIRED`,
      );
    },
  };
}

function createDryRunDraftResult(
  context: AiAssistantConnectorContext,
  connector: AiAssistantConnectorKey,
  prefix: string,
  target: string,
): AiAssistantConnectorResult<{ draftId: string }> {
  return {
    ok: context.dryRun,
    auditId: context.correlationId,
    data: context.dryRun ? { draftId: `${prefix}-draft-${normalizeConnectorIdPart(target)}` } : undefined,
    errorCode: context.dryRun ? undefined : `${connector.toUpperCase()}_DRY_RUN_REQUIRED`,
  };
}

function createDryRunSyncResult(
  context: AiAssistantConnectorContext,
  errorCode: string,
): AiAssistantConnectorResult<{ syncedAt: string }> {
  return {
    ok: context.dryRun,
    auditId: context.correlationId,
    data: context.dryRun ? { syncedAt: new Date(0).toISOString() } : undefined,
    errorCode: context.dryRun ? undefined : errorCode,
  };
}

function createDryRunExecuteResult(
  context: AiAssistantConnectorContext,
  connector: AiAssistantConnectorKey,
  input: AiAssistantConnectorExecuteInput,
  errorCode: string,
): AiAssistantConnectorResult<{ executionId: string }> {
  if (!context.dryRun || !input.approved) {
    return {
      ok: false,
      auditId: context.correlationId,
      errorCode: input.approved ? errorCode : "AI_ASSISTANT_APPROVAL_REQUIRED",
    };
  }

  return {
    ok: true,
    auditId: context.correlationId,
    data: {
      executionId: `${connector}-dry-run-${normalizeConnectorIdPart(input.idempotencyKey)}`,
    },
  };
}

function normalizeConnectorIdPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9а-яё-]+/gi, "-").replace(/-+/g, "-") || "item";
}
