import type {
  ReportAggregationGrain,
  ReportExportFormat,
} from "../reports/aggregation-contracts";
import type { ServerPageQuery } from "./pagination";
import {
  getModuleExportPlan,
  type ModuleExportPlan,
  type ModuleExportQueryValidationIssue,
  validateModuleExportQuery,
} from "./moduleExportPlans";

export type ServerExportRequestIssueCode =
  | "export_plan_missing"
  | "export_format_not_allowed"
  | "export_grain_not_allowed"
  | "requested_by_required"
  | "client_rows_forbidden"
  | ModuleExportQueryValidationIssue["code"];

export type ServerExportRequestIssue = {
  code: ServerExportRequestIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerExportRequestEnvelope = {
  moduleId: string;
  workspaceId: ModuleExportPlan["workspaceId"];
  resource: string;
  databaseAction: string;
  executionMode: "server-only";
  generationMode: "queued";
  sourceKind: ModuleExportPlan["sourceKind"];
  exportRequestEntity: string;
  format: ReportExportFormat;
  grain: ReportAggregationGrain;
  requestedBy: string;
  rowLimit: number;
  storesFileByReference: true;
  avoidsClientSideRecalculation: true;
  query: ServerPageQuery;
};

export type ServerExportRequestRejection = {
  code: "export_request_invalid";
  message: string;
  issues: ServerExportRequestIssue[];
};

export type ServerExportRequestEnvelopeResult =
  | { ok: true; envelope: ServerExportRequestEnvelope }
  | { ok: false; rejection: ServerExportRequestRejection };

export type ServerExportRequestDraft = {
  moduleId: string;
  format: unknown;
  grain: unknown;
  requestedBy: string;
  query: ServerPageQuery;
  plan?: ModuleExportPlan;
};

const forbiddenClientPayloadFields = new Set([
  "allrows",
  "dataset",
  "records",
  "rows",
  "table",
]);

function normalizeFilterName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isForbiddenClientPayloadField(field: string) {
  const normalizedField = normalizeFilterName(field);

  return [...forbiddenClientPayloadFields].some((forbiddenField) => (
    normalizedField === forbiddenField || normalizedField.startsWith(forbiddenField)
  ));
}

function createRejection(issues: ServerExportRequestIssue[]): ServerExportRequestRejection {
  return {
    code: "export_request_invalid",
    message: "Export request does not satisfy the server-side queued export contract.",
    issues,
  };
}

export function validateServerExportRequestDraft(
  draft: ServerExportRequestDraft,
): ServerExportRequestIssue[] {
  const plan = draft.plan ?? getModuleExportPlan(draft.moduleId);

  if (!plan) {
    return [{
      code: "export_plan_missing",
      severity: "blocker",
      message: "Module has no declared export plan.",
    }];
  }

  const issues: ServerExportRequestIssue[] = [];

  if (typeof draft.format !== "string" || !plan.allowedFormats.includes(draft.format as ReportExportFormat)) {
    issues.push({
      code: "export_format_not_allowed",
      severity: "blocker",
      message: "Export format is not allowed for this module.",
      field: "format",
    });
  }

  if (typeof draft.grain !== "string" || !plan.allowedGrains.includes(draft.grain as ReportAggregationGrain)) {
    issues.push({
      code: "export_grain_not_allowed",
      severity: "blocker",
      message: "Export aggregation grain is not allowed for this module.",
      field: "grain",
    });
  }

  if (!draft.requestedBy.trim()) {
    issues.push({
      code: "requested_by_required",
      severity: "blocker",
      message: "Export request must keep the user who requested the file.",
      field: "requestedBy",
    });
  }

  Object.keys(draft.query.filters).forEach((field) => {
    if (isForbiddenClientPayloadField(field)) {
      issues.push({
        code: "client_rows_forbidden",
        severity: "blocker",
        message: "Export request cannot include client-loaded rows or datasets.",
        field,
      });
    }
  });

  validateModuleExportQuery(plan, draft.query).forEach((issue) => {
    issues.push({
      code: issue.code,
      severity: "blocker",
      message: issue.message,
      field: issue.field,
    });
  });

  return issues;
}

export function createServerExportRequestEnvelope(
  draft: ServerExportRequestDraft,
): ServerExportRequestEnvelopeResult {
  const plan = draft.plan ?? getModuleExportPlan(draft.moduleId);
  const issues = validateServerExportRequestDraft({ ...draft, plan });

  if (!plan || issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: plan.moduleId,
      workspaceId: plan.workspaceId,
      resource: plan.resource,
      databaseAction: plan.databaseAction,
      executionMode: "server-only",
      generationMode: "queued",
      sourceKind: plan.sourceKind,
      exportRequestEntity: plan.exportRequestEntity,
      format: draft.format as ReportExportFormat,
      grain: draft.grain as ReportAggregationGrain,
      requestedBy: draft.requestedBy.trim(),
      rowLimit: plan.maxRowsPerExport,
      storesFileByReference: true,
      avoidsClientSideRecalculation: true,
      query: draft.query,
    },
  };
}
