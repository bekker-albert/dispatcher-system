export type ImportBatchFormat = "csv" | "xlsx";
export type ImportBatchMode = "preview" | "stage" | "validate";

export type ServerImportBatchIssueCode =
  | "file_reference_required"
  | "format_not_allowed"
  | "inline_import_payload_forbidden"
  | "preview_limit_exceeded"
  | "requested_by_required"
  | "row_count_required"
  | "row_limit_exceeded";

export type ServerImportBatchIssue = {
  code: ServerImportBatchIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ServerImportBatchEnvelope = {
  moduleId: string;
  requestedBy: string;
  executionMode: "server-only";
  importMode: ImportBatchMode;
  format: ImportBatchFormat;
  sourceFileId: string;
  originalFileName?: string;
  worksheetName?: string;
  declaredRowCount: number;
  previewRowLimit: number;
  maxRows: number;
  storesFileByReference: true;
  noInlinePayload: true;
  stagedValidationRequired: true;
};

export type ServerImportBatchRejection = {
  code: "import_batch_invalid";
  message: string;
  issues: ServerImportBatchIssue[];
};

export type ServerImportBatchEnvelopeResult =
  | { ok: true; envelope: ServerImportBatchEnvelope }
  | { ok: false; rejection: ServerImportBatchRejection };

export type ServerImportBatchDraft = {
  moduleId: string;
  requestedBy: string;
  sourceFileId?: string;
  originalFileName?: string;
  worksheetName?: string;
  format: unknown;
  mode: ImportBatchMode;
  declaredRowCount?: number;
  previewRowCount?: number;
  maxRows?: number;
  maxPreviewRows?: number;
} & Record<string, unknown>;

const allowedImportFormats: ImportBatchFormat[] = ["csv", "xlsx"];
const defaultMaxImportRows = 1_000;
const defaultMaxPreviewRows = 50;

const forbiddenInlinePayloadFields = new Set([
  "allrows",
  "base64",
  "bytes",
  "content",
  "data",
  "dataset",
  "records",
  "rows",
  "table",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function createRejection(issues: ServerImportBatchIssue[]): ServerImportBatchRejection {
  return {
    code: "import_batch_invalid",
    message: "Import batch does not satisfy the server-side staged import contract.",
    issues,
  };
}

export function validateServerImportBatchDraft(
  draft: ServerImportBatchDraft,
): ServerImportBatchIssue[] {
  const issues: ServerImportBatchIssue[] = [];
  const maxRows = draft.maxRows ?? defaultMaxImportRows;
  const maxPreviewRows = draft.maxPreviewRows ?? defaultMaxPreviewRows;

  if (!draft.requestedBy.trim()) {
    issues.push({
      code: "requested_by_required",
      severity: "blocker",
      message: "Import batch must keep the user who requested validation.",
      field: "requestedBy",
    });
  }

  if (!draft.sourceFileId?.trim()) {
    issues.push({
      code: "file_reference_required",
      severity: "blocker",
      message: "Import batch must reference a stored source file.",
      field: "sourceFileId",
    });
  }

  if (typeof draft.format !== "string" || !allowedImportFormats.includes(draft.format as ImportBatchFormat)) {
    issues.push({
      code: "format_not_allowed",
      severity: "blocker",
      message: "Import batch format must be csv or xlsx.",
      field: "format",
    });
  }

  Object.keys(draft).forEach((field) => {
    if (forbiddenInlinePayloadFields.has(normalizeFieldName(field))) {
      issues.push({
        code: "inline_import_payload_forbidden",
        severity: "blocker",
        message: "Import batch must not carry rows, bytes, base64, or table data inline.",
        field,
      });
    }
  });

  const declaredRowCount = draft.declaredRowCount;

  if (typeof declaredRowCount !== "number" || !Number.isInteger(declaredRowCount) || declaredRowCount < 0) {
    issues.push({
      code: "row_count_required",
      severity: "blocker",
      message: "Import batch must declare the parsed source row count before staging.",
      field: "declaredRowCount",
    });
  } else if (declaredRowCount > maxRows) {
    issues.push({
      code: "row_limit_exceeded",
      severity: "blocker",
      message: "Import batch exceeds the module row limit.",
      field: "declaredRowCount",
    });
  }

  if (draft.previewRowCount !== undefined && draft.previewRowCount > maxPreviewRows) {
    issues.push({
      code: "preview_limit_exceeded",
      severity: "blocker",
      message: "Import preview exceeds the allowed preview row limit.",
      field: "previewRowCount",
    });
  }

  return issues;
}

export function createServerImportBatchEnvelope(
  draft: ServerImportBatchDraft,
): ServerImportBatchEnvelopeResult {
  const issues = validateServerImportBatchDraft(draft);
  const maxRows = draft.maxRows ?? defaultMaxImportRows;
  const previewRowLimit = draft.maxPreviewRows ?? defaultMaxPreviewRows;

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
      importMode: draft.mode,
      format: draft.format as ImportBatchFormat,
      sourceFileId: draft.sourceFileId ?? "",
      ...(draft.originalFileName ? { originalFileName: draft.originalFileName } : {}),
      ...(draft.worksheetName ? { worksheetName: draft.worksheetName } : {}),
      declaredRowCount: draft.declaredRowCount ?? 0,
      previewRowLimit,
      maxRows,
      storesFileByReference: true,
      noInlinePayload: true,
      stagedValidationRequired: true,
    },
  };
}
