export type ImportValidationSeverity = "error" | "warning";

export type ImportValidationIssue = {
  rowNumber?: number;
  field?: string;
  code: string;
  message: string;
  severity: ImportValidationSeverity;
};

export type ImportValidationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
};

export type ServerImportValidationIssueCode =
  | "batch_reference_required"
  | "file_reference_required"
  | "inline_validation_payload_forbidden"
  | "issue_count_invalid"
  | "issue_page_limit_exceeded"
  | "issue_row_out_of_range"
  | "requested_by_required"
  | "row_summary_invalid";

export type ServerImportValidationContractIssue = {
  code: ServerImportValidationIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerImportValidationEnvelope = {
  moduleId: string;
  requestedBy: string;
  executionMode: "server-only";
  resultMode: "summary-with-limited-issues";
  batchId: string;
  sourceFileId: string;
  summary: ImportValidationSummary;
  totalIssueCount: number;
  issuePageSize: number;
  returnedIssueCount: number;
  hasMoreIssues: boolean;
  issues: ImportValidationIssue[];
  noInlinePayload: true;
};

export type ServerImportValidationRejection = {
  code: "import_validation_invalid";
  message: string;
  issues: ServerImportValidationContractIssue[];
};

export type ServerImportValidationEnvelopeResult =
  | { ok: true; envelope: ServerImportValidationEnvelope }
  | { ok: false; rejection: ServerImportValidationRejection };

export type ServerImportValidationDraft = {
  moduleId: string;
  requestedBy: string;
  batchId?: string;
  sourceFileId?: string;
  summary: ImportValidationSummary;
  totalIssueCount?: number;
  issuePageSize?: number;
  maxIssuePageSize?: number;
  issues: ImportValidationIssue[];
} & Record<string, unknown>;

const defaultIssuePageSize = 50;
const defaultMaxIssuePageSize = 100;

const forbiddenInlinePayloadFields = new Set([
  "allrows",
  "base64",
  "bytes",
  "content",
  "data",
  "dataset",
  "parsedrows",
  "rawrows",
  "records",
  "rows",
  "table",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isNonNegativeInteger(value: number) {
  return Number.isInteger(value) && value >= 0;
}

function hasValidSummary(summary: ImportValidationSummary) {
  return (
    isNonNegativeInteger(summary.totalRows) &&
    isNonNegativeInteger(summary.validRows) &&
    isNonNegativeInteger(summary.invalidRows) &&
    isNonNegativeInteger(summary.warningRows) &&
    summary.validRows + summary.invalidRows <= summary.totalRows &&
    summary.warningRows <= summary.totalRows
  );
}

function createRejection(
  issues: ServerImportValidationContractIssue[],
): ServerImportValidationRejection {
  return {
    code: "import_validation_invalid",
    message: "Import validation result does not satisfy the bounded server-side contract.",
    issues,
  };
}

export function validateServerImportValidationDraft(
  draft: ServerImportValidationDraft,
): ServerImportValidationContractIssue[] {
  const issues: ServerImportValidationContractIssue[] = [];
  const issuePageSize = draft.issuePageSize ?? defaultIssuePageSize;
  const maxIssuePageSize = draft.maxIssuePageSize ?? defaultMaxIssuePageSize;
  const totalIssueCount = draft.totalIssueCount ?? draft.issues.length;

  if (!draft.requestedBy.trim()) {
    issues.push({
      code: "requested_by_required",
      severity: "blocker",
      message: "Import validation must keep the user who requested validation.",
      field: "requestedBy",
    });
  }

  if (!draft.batchId?.trim()) {
    issues.push({
      code: "batch_reference_required",
      severity: "blocker",
      message: "Import validation must reference the staged import batch.",
      field: "batchId",
    });
  }

  if (!draft.sourceFileId?.trim()) {
    issues.push({
      code: "file_reference_required",
      severity: "blocker",
      message: "Import validation must reference the stored source file.",
      field: "sourceFileId",
    });
  }

  Object.keys(draft).forEach((field) => {
    if (forbiddenInlinePayloadFields.has(normalizeFieldName(field))) {
      issues.push({
        code: "inline_validation_payload_forbidden",
        severity: "blocker",
        message: "Import validation must not carry parsed rows, bytes, base64, or table data inline.",
        field,
      });
    }
  });

  if (!hasValidSummary(draft.summary)) {
    issues.push({
      code: "row_summary_invalid",
      severity: "blocker",
      message: "Import validation summary must contain non-negative row counts within totalRows.",
      field: "summary",
    });
  }

  if (
    !Number.isInteger(issuePageSize) ||
    issuePageSize < 1 ||
    !Number.isInteger(maxIssuePageSize) ||
    maxIssuePageSize < 1 ||
    issuePageSize > maxIssuePageSize ||
    draft.issues.length > issuePageSize
  ) {
    issues.push({
      code: "issue_page_limit_exceeded",
      severity: "blocker",
      message: "Import validation may return only one bounded page of row issues.",
      field: "issues",
    });
  }

  if (!isNonNegativeInteger(totalIssueCount) || totalIssueCount < draft.issues.length) {
    issues.push({
      code: "issue_count_invalid",
      severity: "blocker",
      message: "Import validation totalIssueCount must cover returned issues.",
      field: "totalIssueCount",
    });
  }

  if (
    draft.issues.some((issue) => (
      issue.rowNumber !== undefined &&
      (!Number.isInteger(issue.rowNumber) || issue.rowNumber < 1 || issue.rowNumber > draft.summary.totalRows)
    ))
  ) {
    issues.push({
      code: "issue_row_out_of_range",
      severity: "blocker",
      message: "Import validation issue row numbers must stay inside the source row count.",
      field: "issues",
    });
  }

  return issues;
}

export function createServerImportValidationEnvelope(
  draft: ServerImportValidationDraft,
): ServerImportValidationEnvelopeResult {
  const issues = validateServerImportValidationDraft(draft);
  const issuePageSize = draft.issuePageSize ?? defaultIssuePageSize;
  const totalIssueCount = draft.totalIssueCount ?? draft.issues.length;

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: draft.moduleId,
      requestedBy: draft.requestedBy.trim(),
      executionMode: "server-only",
      resultMode: "summary-with-limited-issues",
      batchId: draft.batchId ?? "",
      sourceFileId: draft.sourceFileId ?? "",
      summary: draft.summary,
      totalIssueCount,
      issuePageSize,
      returnedIssueCount: draft.issues.length,
      hasMoreIssues: totalIssueCount > draft.issues.length,
      issues: draft.issues,
      noInlinePayload: true,
    },
  };
}
