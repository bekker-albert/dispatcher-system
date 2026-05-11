import type {
  PatchFieldChange,
  PatchSaveCommand,
  VersionedEntityReference,
} from "../../domain/editing/patchEditing";
import type { ServerChangeHistoryEnvelope } from "../../domain/audit/changeHistoryEnvelope";
import {
  createServerCreateMutationEnvelope,
  type ServerCreateMutationEnvelope,
  type ServerCreateMutationIssue,
} from "../../domain/data-access/createMutationEnvelope";
import {
  getModuleCreateMutationPlan,
  type ModuleCreateMutationPlan,
} from "../../domain/data-access/moduleCreateMutationPlans";
import {
  listModulePatchMutationPlans,
  type ModulePatchMutationPlan,
} from "../../domain/data-access/modulePatchMutationPlans";
import {
  createServerPatchMutationEnvelope,
  type ServerPatchMutationEnvelope,
  type ServerPatchMutationIssue,
} from "../../domain/data-access/patchMutationEnvelope";
import {
  getModuleWritePipelinePlan,
  type ModuleWritePipelinePlan,
} from "../../domain/data-access/moduleWritePipelinePlans";
import type { ServerWriteSideEffectsEnvelope } from "../../domain/data-access/writeSideEffectsEnvelope";
import { createModuleDatabaseAuthorizationContext } from "../../domain/data-access/moduleDatabaseAuthorization";
import type {
  ServerCreateWriteTransactionEnvelope,
  ServerPatchWriteTransactionEnvelope,
} from "../../domain/data-access/writeTransactionEnvelope";
import {
  createDatabaseChangeHistoryInsertSqlPlan,
  createDatabaseCreateDuplicateCheckSqlPlans,
  createDatabaseCreateEntityInsertSqlPlan,
  createDatabasePatchMutationSetSqlPlan,
  createDatabasePatchMutationWhereSqlPlan,
  evaluateDatabaseChangeHistoryInsertResult,
  evaluateDatabaseCreateDuplicateCheckResults,
  evaluateDatabaseCreateEntityInsertResult,
  evaluateDatabasePatchMutationResult,
  type DatabaseCreateDuplicateCheckDecision,
  type DatabaseCreateDuplicateCheckResult,
  type DatabaseCreateDuplicateCheckSqlPlan,
  type DatabaseCreateEntityInsertDraft,
  type DatabaseCreateEntityInsertResultDecision,
  type DatabaseCreateEntityInsertSqlPlan,
  type DatabaseChangeHistoryInsertSqlPlan,
  type DatabaseChangeHistoryInsertResultDecision,
  type DatabasePatchMutationResultDecision,
  type DatabasePatchMutationSetDraft,
  type DatabasePatchMutationSetSqlPlan,
  type DatabasePatchMutationWhereSqlPlan,
} from "./mutation-sql-builder";
import {
  createDatabaseCreateWriteTransactionSqlPlan,
  createDatabasePatchWriteTransactionSqlPlan,
  type DatabaseCreateWriteTransactionSqlPlan,
  type DatabasePatchWriteTransactionSqlPlan,
} from "./mutation-transaction-plan";
import {
  createDatabasePostCommitSideEffectsPlan,
  type DatabasePostCommitSideEffectsPlan,
} from "./mutation-side-effects-plan";
import {
  createDatabaseCreateDuplicateResponsePlan,
  createDatabaseCreateWriteSuccessResponsePlan,
  createDatabasePatchConflictResponsePlan,
  createDatabasePatchWriteSuccessResponsePlan,
  type DatabaseCreateDuplicateResponsePlan,
  type DatabaseCreateWriteSuccessResponsePlan,
  type DatabasePatchConflictResponsePlan,
  type DatabasePatchWriteSuccessResponsePlan,
} from "./mutation-response-plan";
import { DatabasePayloadError, requirePayloadRecord } from "./validation";
import type { LiveModuleDatabaseHandlerContext } from "./module-live-handlers";

export type LiveModuleCreateWriteExecutionContext = {
  pipelineKind: "create";
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  pipeline: ModuleWritePipelinePlan;
  createPlan: ModuleCreateMutationPlan;
  createEnvelope: ServerCreateMutationEnvelope;
  maxEntityRowWrites: 1;
  requiresAtomicTransaction: true;
  requiresChangeHistory: true;
  requiresPostCommitSideEffects: true;
  requiresSectionScope: boolean;
  sectionScope?: { sectionId: string };
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
  createEntityInsertSqlPlan: (draft: DatabaseCreateEntityInsertDraft) => DatabaseCreateEntityInsertSqlPlan;
  createDuplicateCheckSqlPlans: () => DatabaseCreateDuplicateCheckSqlPlan[];
  createChangeHistoryInsertSqlPlan: (
    historyEnvelope: ServerChangeHistoryEnvelope,
  ) => DatabaseChangeHistoryInsertSqlPlan;
  evaluateEntityInsertResult: (result: { affectedRows: number }) => DatabaseCreateEntityInsertResultDecision;
  evaluateChangeHistoryInsertResult: (
    result: { affectedRows: number; expectedRowCount: number },
  ) => DatabaseChangeHistoryInsertResultDecision;
  createWriteTransactionSqlPlan: (
    input: {
      transaction: ServerCreateWriteTransactionEnvelope;
      duplicateCheckSqlPlans: DatabaseCreateDuplicateCheckSqlPlan[];
      entityInsertSqlPlan: DatabaseCreateEntityInsertSqlPlan;
      historyInsertSqlPlan: DatabaseChangeHistoryInsertSqlPlan;
    },
  ) => DatabaseCreateWriteTransactionSqlPlan;
  createPostCommitSideEffectsPlan: (
    input: {
      sideEffects: ServerWriteSideEffectsEnvelope;
      transactionSqlPlan: DatabaseCreateWriteTransactionSqlPlan;
    },
  ) => DatabasePostCommitSideEffectsPlan;
  createWriteSuccessResponsePlan: (
    input: {
      transaction: ServerCreateWriteTransactionEnvelope;
      duplicateDecision: DatabaseCreateDuplicateCheckDecision;
      insertDecision: DatabaseCreateEntityInsertResultDecision;
      historyDecision: DatabaseChangeHistoryInsertResultDecision;
      sideEffectsPlan: DatabasePostCommitSideEffectsPlan;
    },
  ) => DatabaseCreateWriteSuccessResponsePlan;
  createDuplicateResponsePlan: (
    input: {
      duplicateDecision: DatabaseCreateDuplicateCheckDecision;
    },
  ) => DatabaseCreateDuplicateResponsePlan;
  evaluateDuplicateCheckResults: (
    results: readonly DatabaseCreateDuplicateCheckResult[],
  ) => DatabaseCreateDuplicateCheckDecision;
};

export type LiveModulePatchWriteExecutionContext = {
  pipelineKind: "patch" | "workflow-transition";
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  pipeline: ModuleWritePipelinePlan;
  patchPlan: ModulePatchMutationPlan;
  patchEnvelope: ServerPatchMutationEnvelope;
  maxEntityRowWrites: 1;
  requiresExpectedVersion: true;
  requiresAtomicTransaction: true;
  requiresChangeHistory: true;
  requiresPostCommitSideEffects: true;
  requiresSectionScope: boolean;
  sectionScope?: { sectionId: string };
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
  createPatchWhereSqlPlan: () => DatabasePatchMutationWhereSqlPlan;
  createPatchSetSqlPlan: (draft: DatabasePatchMutationSetDraft) => DatabasePatchMutationSetSqlPlan;
  createChangeHistoryInsertSqlPlan: (
    historyEnvelope: ServerChangeHistoryEnvelope,
  ) => DatabaseChangeHistoryInsertSqlPlan;
  evaluateChangeHistoryInsertResult: (
    result: { affectedRows: number; expectedRowCount: number },
  ) => DatabaseChangeHistoryInsertResultDecision;
  createWriteTransactionSqlPlan: (
    input: {
      transaction: ServerPatchWriteTransactionEnvelope;
      patchSetSqlPlan: DatabasePatchMutationSetSqlPlan;
      patchWhereSqlPlan: DatabasePatchMutationWhereSqlPlan;
      historyInsertSqlPlan: DatabaseChangeHistoryInsertSqlPlan;
    },
  ) => DatabasePatchWriteTransactionSqlPlan;
  createPostCommitSideEffectsPlan: (
    input: {
      sideEffects: ServerWriteSideEffectsEnvelope;
      transactionSqlPlan: DatabasePatchWriteTransactionSqlPlan;
    },
  ) => DatabasePostCommitSideEffectsPlan;
  createWriteSuccessResponsePlan: (
    input: {
      transaction: ServerPatchWriteTransactionEnvelope;
      patchDecision: DatabasePatchMutationResultDecision;
      historyDecision: DatabaseChangeHistoryInsertResultDecision;
      sideEffectsPlan: DatabasePostCommitSideEffectsPlan;
    },
  ) => DatabasePatchWriteSuccessResponsePlan;
  createConflictResponsePlan: (
    input: {
      transaction: ServerPatchWriteTransactionEnvelope;
      patchDecision: DatabasePatchMutationResultDecision;
    },
  ) => DatabasePatchConflictResponsePlan;
  evaluatePatchResult: (result: { affectedRows: number }) => DatabasePatchMutationResultDecision;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function describeIssues(issues: Array<ServerCreateMutationIssue | ServerPatchMutationIssue>) {
  return issues.map((issue) => issue.code).join(", ");
}

function assertWritePipeline(context: LiveModuleDatabaseHandlerContext) {
  const pipeline = getModuleWritePipelinePlan(context.moduleId, context.action);
  if (!pipeline || pipeline.resource !== context.resource || pipeline.databaseAction !== context.action) {
    throw new DatabasePayloadError(
      `Live module write handler has no matching write pipeline for ${context.resource}/${context.action}.`,
    );
  }

  return pipeline;
}

function assertWriteSectionScope(context: LiveModuleDatabaseHandlerContext) {
  const authorizationContext = createModuleDatabaseAuthorizationContext({
    resource: context.resource,
    action: context.action,
    payload: context.payload,
  });

  if (authorizationContext?.missingSectionScope) {
    throw new DatabasePayloadError(
      `Live module write handler requires section scope for ${context.resource}/${context.action}.`,
    );
  }

  return authorizationContext?.sectionId
    ? {
        required: authorizationContext.requirement.sectionScoped,
        sectionId: authorizationContext.sectionId,
      }
    : {
        required: Boolean(authorizationContext?.requirement.sectionScoped),
        sectionId: undefined,
      };
}

function getCreateData(payload: unknown) {
  const record = requirePayloadRecord(payload, "payload");
  const data = record.data;

  return isRecord(data) ? data : record;
}

function getCreatePlan(context: LiveModuleDatabaseHandlerContext) {
  const createPlan = getModuleCreateMutationPlan(context.moduleId);
  if (
    !createPlan
    || createPlan.resource !== context.resource
    || createPlan.databaseAction !== context.action
  ) {
    throw new DatabasePayloadError(
      `Live module create handler has no matching create plan for ${context.resource}/${context.action}.`,
    );
  }

  return createPlan;
}

function getPatchPlan(context: LiveModuleDatabaseHandlerContext) {
  const patchPlan = listModulePatchMutationPlans(context.workspaceId).find((plan) => (
    plan.moduleId === context.moduleId
    && plan.resource === context.resource
    && plan.databaseAction === context.action
  ));
  if (!patchPlan) {
    throw new DatabasePayloadError(
      `Live module patch handler has no matching patch plan for ${context.resource}/${context.action}.`,
    );
  }

  return patchPlan;
}

function normalizeEntity(value: unknown): VersionedEntityReference {
  const entity = requirePayloadRecord(value, "patch.entity");

  return {
    id: typeof entity.id === "string" ? entity.id : "",
    version: typeof entity.version === "number" ? entity.version : Number(entity.version),
    ...(typeof entity.updatedAt === "string" ? { updatedAt: entity.updatedAt } : {}),
    ...(typeof entity.updatedBy === "string" ? { updatedBy: entity.updatedBy } : {}),
  };
}

function normalizePatchChanges(value: unknown): PatchFieldChange[] {
  if (!Array.isArray(value)) {
    throw new DatabasePayloadError("Live module patch handler requires patch.changes array.");
  }

  return value.map((change) => {
    const record = requirePayloadRecord(change, "patch.changes[]");
    const field = typeof record.field === "string" ? record.field : "";

    return {
      field,
      ...(Object.hasOwn(record, "previousValue") ? { previousValue: record.previousValue } : {}),
      nextValue: record.nextValue,
    };
  });
}

function getPatchCommand(payload: unknown): PatchSaveCommand {
  const record = requirePayloadRecord(payload, "payload");
  const patchRecord = isRecord(record.patch) ? record.patch : record;

  return {
    entityType: typeof patchRecord.entityType === "string" ? patchRecord.entityType : "",
    entity: normalizeEntity(patchRecord.entity),
    changes: normalizePatchChanges(patchRecord.changes),
    ...(typeof patchRecord.reason === "string" ? { reason: patchRecord.reason } : {}),
  };
}

export function createLiveModuleCreateWriteExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleCreateWriteExecutionContext {
  const pipeline = assertWritePipeline(context);
  const sectionScope = assertWriteSectionScope(context);
  const createPlan = getCreatePlan(context);
  if (pipeline.pipelineKind !== "create") {
    throw new DatabasePayloadError(
      `Live module write handler expected create pipeline for ${context.resource}/${context.action}.`,
    );
  }

  const createEnvelope = createServerCreateMutationEnvelope({
    moduleId: context.moduleId,
    data: getCreateData(context.payload),
  });
  if (!createEnvelope.ok) {
    throw new DatabasePayloadError(
      `Live module create payload rejected: ${describeIssues(createEnvelope.rejection.issues)}.`,
    );
  }

  return {
    pipelineKind: "create",
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    pipeline,
    createPlan,
    createEnvelope: createEnvelope.envelope,
    maxEntityRowWrites: 1,
    requiresAtomicTransaction: true,
    requiresChangeHistory: true,
    requiresPostCommitSideEffects: true,
    requiresSectionScope: sectionScope.required,
    ...(sectionScope.sectionId ? { sectionScope: { sectionId: sectionScope.sectionId } } : {}),
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
    createEntityInsertSqlPlan: (draft) => createDatabaseCreateEntityInsertSqlPlan(
      createEnvelope.envelope,
      createPlan,
      draft,
    ),
    createDuplicateCheckSqlPlans: () => createDatabaseCreateDuplicateCheckSqlPlans(
      createEnvelope.envelope,
      createPlan,
    ),
    createChangeHistoryInsertSqlPlan: (historyEnvelope) => createDatabaseChangeHistoryInsertSqlPlan(
      historyEnvelope,
    ),
    evaluateEntityInsertResult: evaluateDatabaseCreateEntityInsertResult,
    evaluateChangeHistoryInsertResult: evaluateDatabaseChangeHistoryInsertResult,
    createWriteTransactionSqlPlan: createDatabaseCreateWriteTransactionSqlPlan,
    createPostCommitSideEffectsPlan: createDatabasePostCommitSideEffectsPlan,
    createWriteSuccessResponsePlan: createDatabaseCreateWriteSuccessResponsePlan,
    createDuplicateResponsePlan: createDatabaseCreateDuplicateResponsePlan,
    evaluateDuplicateCheckResults: evaluateDatabaseCreateDuplicateCheckResults,
  };
}

export function createLiveModulePatchWriteExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModulePatchWriteExecutionContext {
  const pipeline = assertWritePipeline(context);
  const sectionScope = assertWriteSectionScope(context);
  if (pipeline.pipelineKind !== "patch" && pipeline.pipelineKind !== "workflow-transition") {
    throw new DatabasePayloadError(
      `Live module write handler expected patch pipeline for ${context.resource}/${context.action}.`,
    );
  }

  const patchPlan = getPatchPlan(context);
  const payload = requirePayloadRecord(context.payload, "payload");
  const patchEnvelope = createServerPatchMutationEnvelope({
    moduleId: context.moduleId,
    action: patchPlan.action,
    patch: getPatchCommand(payload),
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
  });
  if (!patchEnvelope.ok) {
    throw new DatabasePayloadError(
      `Live module patch payload rejected: ${describeIssues(patchEnvelope.rejection.issues)}.`,
    );
  }

  return {
    pipelineKind: pipeline.pipelineKind,
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    pipeline,
    patchPlan,
    patchEnvelope: patchEnvelope.envelope,
    maxEntityRowWrites: 1,
    requiresExpectedVersion: true,
    requiresAtomicTransaction: true,
    requiresChangeHistory: true,
    requiresPostCommitSideEffects: true,
    requiresSectionScope: sectionScope.required,
    ...(sectionScope.sectionId ? { sectionScope: { sectionId: sectionScope.sectionId } } : {}),
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
    createPatchWhereSqlPlan: () => createDatabasePatchMutationWhereSqlPlan(
      patchEnvelope.envelope,
      patchPlan,
      sectionScope.sectionId ? { sectionId: sectionScope.sectionId } : {},
    ),
    createPatchSetSqlPlan: (draft) => createDatabasePatchMutationSetSqlPlan(
      patchEnvelope.envelope,
      patchPlan,
      draft,
    ),
    createChangeHistoryInsertSqlPlan: (historyEnvelope) => createDatabaseChangeHistoryInsertSqlPlan(
      historyEnvelope,
      patchPlan.changeHistoryEntity,
    ),
    evaluateChangeHistoryInsertResult: evaluateDatabaseChangeHistoryInsertResult,
    createWriteTransactionSqlPlan: createDatabasePatchWriteTransactionSqlPlan,
    createPostCommitSideEffectsPlan: createDatabasePostCommitSideEffectsPlan,
    createWriteSuccessResponsePlan: createDatabasePatchWriteSuccessResponsePlan,
    createConflictResponsePlan: createDatabasePatchConflictResponsePlan,
    evaluatePatchResult: evaluateDatabasePatchMutationResult,
  };
}
