import {
  createServerExportRequestEnvelope,
  type ServerExportRequestEnvelope,
} from "../../domain/data-access/exportRequestEnvelope";
import {
  createServerImportBatchEnvelope,
  type ServerImportBatchEnvelope,
} from "../../domain/data-access/importBatchEnvelope";
import {
  createServerImportValidationEnvelope,
  type ServerImportValidationEnvelope,
} from "../../domain/data-access/importValidationEnvelope";
import {
  createModuleImportBatchDraft,
  createModuleImportValidationDraft,
  getModuleImportPlanByDatabaseAction,
  type ModuleImportPlan,
} from "../../domain/data-access/moduleImportPlans";
import {
  getModuleExportPlan,
  type ModuleExportPlan,
} from "../../domain/data-access/moduleExportPlans";
import { normalizeServerPageQueryDraft } from "../../domain/data-access/queryPolicy";
import { DatabasePayloadError, requirePayloadRecord } from "./validation";
import type { LiveModuleDatabaseHandlerContext } from "./module-live-handlers";
import { getDatabaseListQueryDraft } from "./query-policy";

export type LiveModuleExportExecutionContext = {
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  plan: ModuleExportPlan;
  exportEnvelope: ServerExportRequestEnvelope;
  generationMode: "queued";
  storesFileByReference: true;
  forbidsInlineFileContent: true;
  avoidsClientSideRecalculation: true;
};

export type LiveModuleImportBatchExecutionContext = {
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  plan: ModuleImportPlan;
  importEnvelope: ServerImportBatchEnvelope;
  storesFileByReference: true;
  requiresStagedValidation: true;
  forbidsWholeTableReplacement: true;
};

export type LiveModuleImportValidationExecutionContext = {
  moduleId: string;
  workspaceId: LiveModuleDatabaseHandlerContext["workspaceId"];
  resource: string;
  action: string;
  plan: ModuleImportPlan;
  validationEnvelope: ServerImportValidationEnvelope;
  returnsValidationSummaryOnly: true;
  issuePageSize: number;
  noInlinePayload: true;
};

const forbiddenInlineFileFields = new Set([
  "allrows",
  "base64",
  "bytes",
  "content",
  "data",
  "dataset",
  "filecontent",
  "records",
  "rows",
  "table",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function assertNoInlineFilePayload(payload: Record<string, unknown>, label: string) {
  const forbiddenField = Object.keys(payload).find((field) => (
    forbiddenInlineFileFields.has(normalizeFieldName(field))
  ));
  if (forbiddenField) {
    throw new DatabasePayloadError(`${label} must not include inline file or table payload field ${forbiddenField}.`);
  }
}

function assertExportPlan(context: LiveModuleDatabaseHandlerContext) {
  const plan = getModuleExportPlan(context.moduleId);
  if (!plan || plan.resource !== context.resource || plan.databaseAction !== context.action) {
    throw new DatabasePayloadError(
      `Live module export handler has no matching export plan for ${context.resource}/${context.action}.`,
    );
  }

  return plan;
}

function assertImportPlan(context: LiveModuleDatabaseHandlerContext) {
  const plan = getModuleImportPlanByDatabaseAction(context.resource, context.action);
  if (!plan || plan.moduleId !== context.moduleId) {
    throw new DatabasePayloadError(
      `Live module import handler has no matching import plan for ${context.resource}/${context.action}.`,
    );
  }

  return plan;
}

export function createLiveModuleExportExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleExportExecutionContext {
  const plan = assertExportPlan(context);
  const payload = requirePayloadRecord(context.payload, "payload");
  assertNoInlineFilePayload(payload, "Live module export handler");
  const query = normalizeServerPageQueryDraft(getDatabaseListQueryDraft(payload));
  const envelope = createServerExportRequestEnvelope({
    moduleId: context.moduleId,
    format: payload.format,
    grain: payload.grain,
    requestedBy: typeof payload.requestedBy === "string" ? payload.requestedBy : "",
    query,
    plan,
  });
  if (!envelope.ok) {
    const issueCodes = envelope.rejection.issues.map((issue) => issue.code).join(", ");
    throw new DatabasePayloadError(`Live module export payload rejected: ${issueCodes}.`);
  }

  return {
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    plan,
    exportEnvelope: envelope.envelope,
    generationMode: "queued",
    storesFileByReference: true,
    forbidsInlineFileContent: true,
    avoidsClientSideRecalculation: true,
  };
}

export function createLiveModuleImportBatchExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleImportBatchExecutionContext {
  const plan = assertImportPlan(context);
  const payload = requirePayloadRecord(context.payload, "payload");
  const envelope = createServerImportBatchEnvelope(createModuleImportBatchDraft(plan, {
    ...payload,
    requestedBy: typeof payload.requestedBy === "string" ? payload.requestedBy : "",
    sourceFileId: typeof payload.sourceFileId === "string" ? payload.sourceFileId : undefined,
    originalFileName: typeof payload.originalFileName === "string" ? payload.originalFileName : undefined,
    worksheetName: typeof payload.worksheetName === "string" ? payload.worksheetName : undefined,
    format: payload.format,
    mode: payload.mode === "preview" || payload.mode === "validate" ? payload.mode : "stage",
    declaredRowCount: typeof payload.declaredRowCount === "number" ? payload.declaredRowCount : undefined,
    previewRowCount: typeof payload.previewRowCount === "number" ? payload.previewRowCount : undefined,
  }));
  if (!envelope.ok) {
    const issueCodes = envelope.rejection.issues.map((issue) => issue.code).join(", ");
    throw new DatabasePayloadError(`Live module import payload rejected: ${issueCodes}.`);
  }

  return {
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    plan,
    importEnvelope: envelope.envelope,
    storesFileByReference: true,
    requiresStagedValidation: true,
    forbidsWholeTableReplacement: true,
  };
}

export function createLiveModuleImportValidationExecutionContext(
  context: LiveModuleDatabaseHandlerContext,
): LiveModuleImportValidationExecutionContext {
  const plan = assertImportPlan(context);
  const payload = requirePayloadRecord(context.payload, "payload");
  const summary = requirePayloadRecord(payload.summary, "summary");
  const issues = Array.isArray(payload.issues) ? payload.issues : [];
  const envelope = createServerImportValidationEnvelope(createModuleImportValidationDraft(plan, {
    ...payload,
    requestedBy: typeof payload.requestedBy === "string" ? payload.requestedBy : "",
    batchId: typeof payload.batchId === "string" ? payload.batchId : undefined,
    sourceFileId: typeof payload.sourceFileId === "string" ? payload.sourceFileId : undefined,
    summary: {
      totalRows: Number(summary.totalRows),
      validRows: Number(summary.validRows),
      invalidRows: Number(summary.invalidRows),
      warningRows: Number(summary.warningRows),
    },
    totalIssueCount: typeof payload.totalIssueCount === "number" ? payload.totalIssueCount : undefined,
    issues,
  }));
  if (!envelope.ok) {
    const issueCodes = envelope.rejection.issues.map((issue) => issue.code).join(", ");
    throw new DatabasePayloadError(`Live module import validation rejected: ${issueCodes}.`);
  }

  return {
    moduleId: context.moduleId,
    workspaceId: context.workspaceId,
    resource: context.resource,
    action: context.action,
    plan,
    validationEnvelope: envelope.envelope,
    returnsValidationSummaryOnly: true,
    issuePageSize: plan.issuePageSize,
    noInlinePayload: true,
  };
}
