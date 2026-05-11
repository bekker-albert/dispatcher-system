import type {
  ReportExportFormat,
  ReportExportRequest,
  ReportExportStatus,
} from "./aggregation-contracts";

export type ReportExportArtifactReference = {
  requestId: string;
  status: ReportExportStatus;
  format: ReportExportFormat;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  byteSize?: number;
  generatedAt?: string;
  expiresAt?: string;
  errorMessage?: string;
};

export type ReportExportArtifactEnvelope = {
  requestId: string;
  reportKey: string;
  status: "ready";
  format: ReportExportFormat;
  fileId: string;
  fileName?: string;
  mimeType: string;
  byteSize: number;
  generatedAt: string;
  expiresAt: string;
  storesFileByReference: true;
  noInlinePayload: true;
};

export type ReportExportArtifactIssueCode =
  | "artifact_not_ready"
  | "file_reference_required"
  | "inline_file_payload_forbidden"
  | "generated_at_required"
  | "expires_at_required"
  | "artifact_expired"
  | "mime_type_not_allowed"
  | "byte_size_required"
  | "byte_size_too_large";

export type ReportExportArtifactIssue = {
  code: ReportExportArtifactIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ReportExportArtifactEnvelopeResult =
  | { ok: true; envelope: ReportExportArtifactEnvelope }
  | {
      ok: false;
      rejection: {
        code: "export_artifact_invalid";
        message: string;
        issues: ReportExportArtifactIssue[];
      };
    };

export type ReportExportArtifactDraft = {
  request: ReportExportRequest;
  artifact: ReportExportArtifactReference & Record<string, unknown>;
  currentTime: string;
  maxByteSize?: number;
};

const defaultMaxExportArtifactBytes = 25 * 1024 * 1024;

const allowedMimeTypesByFormat: Record<ReportExportFormat, string[]> = {
  csv: ["text/csv"],
  pdf: ["application/pdf"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const forbiddenInlinePayloadFields = new Set([
  "base64",
  "bytes",
  "content",
  "data",
  "inlinebytes",
]);

function normalizeFieldName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isValidDateTime(value: string | undefined): value is string {
  if (!value?.trim()) return false;

  return Number.isFinite(Date.parse(value));
}

function createRejection(issues: ReportExportArtifactIssue[]) {
  return {
    code: "export_artifact_invalid" as const,
    message: "Export artifact does not satisfy the file-reference lifecycle contract.",
    issues,
  };
}

export function validateReportExportArtifactReference(
  artifact: ReportExportArtifactReference & Record<string, unknown>,
  currentTime: string,
  maxByteSize = defaultMaxExportArtifactBytes,
): ReportExportArtifactIssue[] {
  const issues: ReportExportArtifactIssue[] = [];

  Object.keys(artifact).forEach((field) => {
    if (forbiddenInlinePayloadFields.has(normalizeFieldName(field))) {
      issues.push({
        code: "inline_file_payload_forbidden",
        severity: "blocker",
        message: "Export artifacts must be referenced by file id, not embedded in payload.",
        field,
      });
    }
  });

  if (artifact.status !== "ready") {
    issues.push({
      code: "artifact_not_ready",
      severity: "blocker",
      message: "Export artifact envelope can be created only for ready files.",
      field: "status",
    });
    return issues;
  }

  if (!artifact.fileId?.trim()) {
    issues.push({
      code: "file_reference_required",
      severity: "blocker",
      message: "Ready export artifact must have a stored file reference.",
      field: "fileId",
    });
  }

  if (!isValidDateTime(artifact.generatedAt)) {
    issues.push({
      code: "generated_at_required",
      severity: "blocker",
      message: "Ready export artifact must keep the generation timestamp.",
      field: "generatedAt",
    });
  }

  const expiresAt = artifact.expiresAt;

  if (!isValidDateTime(expiresAt)) {
    issues.push({
      code: "expires_at_required",
      severity: "blocker",
      message: "Ready export artifact must have an expiration timestamp.",
      field: "expiresAt",
    });
  } else if (Date.parse(expiresAt) <= Date.parse(currentTime)) {
    issues.push({
      code: "artifact_expired",
      severity: "blocker",
      message: "Export artifact is already expired.",
      field: "expiresAt",
    });
  }

  if (!artifact.mimeType || !allowedMimeTypesByFormat[artifact.format].includes(artifact.mimeType)) {
    issues.push({
      code: "mime_type_not_allowed",
      severity: "blocker",
      message: "Export artifact mime type does not match the requested format.",
      field: "mimeType",
    });
  }

  const byteSize = artifact.byteSize;

  if (typeof byteSize !== "number" || !Number.isFinite(byteSize) || byteSize <= 0) {
    issues.push({
      code: "byte_size_required",
      severity: "blocker",
      message: "Ready export artifact must keep a positive byte size.",
      field: "byteSize",
    });
  } else if (byteSize > maxByteSize) {
    issues.push({
      code: "byte_size_too_large",
      severity: "blocker",
      message: "Export artifact exceeds the module file size limit.",
      field: "byteSize",
    });
  }

  return issues;
}

export function createReportExportArtifactEnvelope(
  draft: ReportExportArtifactDraft,
): ReportExportArtifactEnvelopeResult {
  const issues = validateReportExportArtifactReference(
    draft.artifact,
    draft.currentTime,
    draft.maxByteSize,
  );

  if (issues.length > 0 || draft.artifact.status !== "ready") {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      requestId: draft.request.id,
      reportKey: draft.request.reportKey,
      status: "ready",
      format: draft.artifact.format,
      fileId: draft.artifact.fileId ?? "",
      ...(draft.artifact.fileName ? { fileName: draft.artifact.fileName } : {}),
      mimeType: draft.artifact.mimeType ?? "",
      byteSize: draft.artifact.byteSize ?? 0,
      generatedAt: draft.artifact.generatedAt ?? "",
      expiresAt: draft.artifact.expiresAt ?? "",
      storesFileByReference: true,
      noInlinePayload: true,
    },
  };
}
