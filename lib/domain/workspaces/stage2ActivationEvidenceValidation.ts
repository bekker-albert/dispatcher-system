import type {
  Stage2ActivationAuditField,
  Stage2ActivationAuditPlan,
} from "./stage2ActivationAuditPlan";
import {
  createExpectedWriteHandlerImplementationPath as createExpectedStage2WriteHandlerImplementationPath,
  isAllowedStage2ImplementationPath,
  normalizeStage2ImplementationPath,
  stage2AllowedImplementationPathDescription,
  stage2ReadModelImplementationPath,
} from "./stage2ImplementationPaths";

export type Stage2ActivationEvidenceResult = "missing" | "failed" | "passed";

export type Stage2ActivationEvidenceDraft = {
  phase?: string;
  moduleId?: string;
  workspaceId?: string;
  resource?: string;
  databaseAction?: string;
  requestedBy?: string;
  changeReason?: string;
  implementationPath?: string;
  verificationCommands?: string[];
  rollbackPlan?: string;
  activationScopeSize?: number;
  preflightResult?: Stage2ActivationEvidenceResult;
  verifyResult?: Stage2ActivationEvidenceResult;
  smokeResult?: Stage2ActivationEvidenceResult;
};

export type Stage2ActivationEvidenceBlockerCode =
  | "missing_required_field"
  | "activation_scope_not_one"
  | "preflight_not_passed"
  | "verify_not_passed"
  | "smoke_not_passed"
  | "verification_command_forbidden"
  | "required_command_missing"
  | "verification_command_missing"
  | "smoke_command_missing"
  | "change_reason_placeholder"
  | "rollback_plan_placeholder"
  | "implementation_path_invalid"
  | "implementation_path_phase_mismatch"
  | "target_mismatch";

export type Stage2ActivationEvidenceBlocker = {
  code: Stage2ActivationEvidenceBlockerCode;
  field?: Stage2ActivationAuditField;
  expected?: string | number;
  actual?: string | number;
};

export type Stage2ActivationEvidenceValidation = {
  evidenceComplete: boolean;
  manualRegistryChangeReviewAllowed: boolean;
  liveRegistrationAllowedFromEvidence: false;
  noMysqlConnection: true;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  expectedImplementationPath?: string;
  requiredFields: Stage2ActivationAuditField[];
  missingFields: Stage2ActivationAuditField[];
  blockers: Stage2ActivationEvidenceBlocker[];
  rule: string;
};

export function validateStage2ActivationEvidence(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceValidation {
  const missingFields = auditPlan.requiredFields.filter((field) => (
    !hasEvidenceField(auditPlan, evidence, field)
  ));
  const blockers: Stage2ActivationEvidenceBlocker[] = [
    ...missingFields.map((field): Stage2ActivationEvidenceBlocker => ({
      code: "missing_required_field",
      field,
    })),
    ...validateTargetMatches(auditPlan, evidence),
    ...validateChangeReason(auditPlan, evidence),
    ...(resolveActivationScopeSize(auditPlan, evidence) === 1 ? [] : [{
      code: "activation_scope_not_one" as const,
      field: "activationScopeSize" as const,
      expected: 1,
      actual: resolveActivationScopeSize(auditPlan, evidence),
    }]),
    ...(resolveResult(evidence.preflightResult) === "passed" ? [] : [{
      code: "preflight_not_passed" as const,
      field: "preflightResult" as const,
      expected: "passed",
      actual: resolveResult(evidence.preflightResult),
    }]),
    ...(resolveResult(evidence.verifyResult) === "passed" ? [] : [{
      code: "verify_not_passed" as const,
      field: "verifyResult" as const,
      expected: "passed",
      actual: resolveResult(evidence.verifyResult),
    }]),
    ...(resolveResult(evidence.smokeResult) === "passed" ? [] : [{
      code: "smoke_not_passed" as const,
      field: "smokeResult" as const,
      expected: "passed",
      actual: resolveResult(evidence.smokeResult),
    }]),
    ...validateVerificationCommandSafety(evidence),
    ...validateRequiredCommands(auditPlan, evidence),
    ...(hasVerificationCommand(evidence, "npm run verify") ? [] : [{
      code: "verification_command_missing" as const,
      field: "verificationCommands" as const,
      expected: "npm run verify",
    }]),
    ...(hasVerificationCommand(evidence, "npm run smoke:local") ? [] : [{
      code: "smoke_command_missing" as const,
      field: "verificationCommands" as const,
      expected: "npm run smoke:local",
    }]),
    ...validateImplementationPath(auditPlan, evidence),
    ...validateRollbackPlan(evidence),
  ];
  const evidenceComplete = blockers.length === 0;
  const expectedImplementationPath = resolveExpectedImplementationPath(auditPlan);

  return {
    evidenceComplete,
    manualRegistryChangeReviewAllowed: evidenceComplete,
    liveRegistrationAllowedFromEvidence: false,
    noMysqlConnection: true,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    ...(expectedImplementationPath ? { expectedImplementationPath } : {}),
    requiredFields: [...auditPlan.requiredFields],
    missingFields,
    blockers,
    rule: "Evidence validation can allow manual registry review, but it never mutates or automatically authorizes the live registry.",
  };
}

function hasEvidenceField(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
  field: Stage2ActivationAuditField,
) {
  const value = resolveEvidenceValue(auditPlan, evidence, field);
  if (Array.isArray(value)) return value.length > 0;

  return value !== undefined && value !== "";
}

function resolveEvidenceValue(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
  field: Stage2ActivationAuditField,
) {
  if (
    field === "phase"
    || field === "moduleId"
    || field === "workspaceId"
    || field === "resource"
    || field === "databaseAction"
  ) {
    return evidence[field] ?? auditPlan.target?.[field];
  }

  if (field === "requestedBy") return evidence.requestedBy ?? auditPlan.requestedBy;
  if (field === "changeReason") return evidence.changeReason ?? auditPlan.changeReason;
  if (field === "rollbackPlan") return evidence.rollbackPlan;
  if (field === "activationScopeSize") return resolveActivationScopeSize(auditPlan, evidence);

  return evidence[field];
}

function resolveActivationScopeSize(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
) {
  return evidence.activationScopeSize ?? auditPlan.activationScopeSize;
}

function resolveResult(result?: Stage2ActivationEvidenceResult) {
  return result ?? "missing";
}

function hasVerificationCommand(
  evidence: Stage2ActivationEvidenceDraft,
  command: string,
) {
  const expected = normalizeVerificationCommand(command);

  return evidence.verificationCommands?.some((verificationCommand) => (
    normalizeVerificationCommand(verificationCommand) === expected
  )) ?? false;
}

function normalizeVerificationCommand(command: string) {
  return command.trim().replace(/\s+/g, " ");
}

const forbiddenVerificationCommandPatterns = [
  /\bnpm\s+run\s+migrate:/i,
  /\b(?:node|jiti|tsx|ts-node)\s+scripts\/migrate/i,
  /\bprisma\s+(?:migrate|db\s+push)\b/i,
  /\bsupabase\s+db\b/i,
  /\bmysql\s+(?:-|--|[A-Za-z0-9_])/i,
  /\bnext\s+(?:dev|start)\b/i,
  /\bpm2\b/i,
  /\bforever\b/i,
  /\bnodemon\b/i,
  /\bconcurrently\b/i,
  /\bwait-on\b/i,
  /\bStart-Process\b/i,
] as const;

function validateVerificationCommandSafety(
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  return (evidence.verificationCommands ?? []).flatMap((command) => (
    forbiddenVerificationCommandPatterns.some((pattern) => pattern.test(command))
      ? [{
        code: "verification_command_forbidden" as const,
        field: "verificationCommands" as const,
        expected: "read-only Stage 2 preflight, review, verify or smoke command",
        actual: command,
      }]
      : []
  ));
}

function validateRequiredCommands(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  return auditPlan.requiredCommands
    .filter((command) => command !== "npm run verify" && command !== "npm run smoke:local")
    .flatMap((command) => (
      hasVerificationCommand(evidence, command)
        ? []
        : [{
          code: "required_command_missing" as const,
          field: "verificationCommands" as const,
          expected: command,
          actual: "missing",
        }]
    ));
}

function validateRollbackPlan(
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  if (!evidence.rollbackPlan || !isPlaceholderRollbackPlan(evidence.rollbackPlan)) return [];

  return [{
    code: "rollback_plan_placeholder",
    field: "rollbackPlan",
    expected: "specific rollback steps for the single live registry key",
    actual: evidence.rollbackPlan,
  }];
}

function isPlaceholderRollbackPlan(rollbackPlan: string) {
  return isPlaceholderText(rollbackPlan);
}

function validateChangeReason(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  const changeReason = resolveChangeReason(auditPlan, evidence);
  if (!changeReason || !isPlaceholderText(changeReason)) return [];

  return [{
    code: "change_reason_placeholder",
    field: "changeReason",
    expected: "specific reason for the single live activation",
    actual: changeReason,
  }];
}

function resolveChangeReason(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
) {
  return evidence.changeReason ?? auditPlan.changeReason;
}

function isPlaceholderText(value: string) {
  return /^(?:todo|tbd|n\/a|na|none|later|fix later|\-+|\.+)$/i.test(value.trim());
}

function validateImplementationPath(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  if (!evidence.implementationPath) return [];
  const normalizedPath = normalizeStage2ImplementationPath(evidence.implementationPath);
  if (!isAllowedStage2ImplementationPath(normalizedPath)) {
    return [{
      code: "implementation_path_invalid",
      field: "implementationPath",
      expected: stage2AllowedImplementationPathDescription,
      actual: evidence.implementationPath,
    }];
  }

  return validateImplementationPathPhase(auditPlan, evidence, normalizedPath);
}

function validateImplementationPathPhase(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
  implementationPath: string,
): Stage2ActivationEvidenceBlocker[] {
  const targetPhase = auditPlan.target?.phase;
  if (!targetPhase) return [];

  if (targetPhase === "read-model" && implementationPath !== stage2ReadModelImplementationPath) {
    return [{
      code: "implementation_path_phase_mismatch",
      field: "implementationPath",
      expected: `${stage2ReadModelImplementationPath} for read-model activation`,
      actual: evidence.implementationPath,
    }];
  }

  if (targetPhase === "write-handler" && !implementationPath.startsWith("lib/server/database/handlers/")) {
    return [{
      code: "implementation_path_phase_mismatch",
      field: "implementationPath",
      expected: "lib/server/database/handlers/*.ts for write-handler activation",
      actual: evidence.implementationPath,
    }];
  }

  const expectedWriteHandlerImplementationPath = createExpectedWriteHandlerImplementationPath(auditPlan);
  if (
    targetPhase === "write-handler"
    && expectedWriteHandlerImplementationPath
    && implementationPath !== expectedWriteHandlerImplementationPath
  ) {
    return [{
      code: "implementation_path_phase_mismatch",
      field: "implementationPath",
      expected: expectedWriteHandlerImplementationPath,
      actual: evidence.implementationPath,
    }];
  }

  return [];
}

function createExpectedWriteHandlerImplementationPath(auditPlan: Stage2ActivationAuditPlan) {
  const target = auditPlan.target;
  if (!target || target.phase !== "write-handler") return undefined;

  return createExpectedStage2WriteHandlerImplementationPath(target.resource, target.databaseAction);
}

function resolveExpectedImplementationPath(auditPlan: Stage2ActivationAuditPlan) {
  const target = auditPlan.target;
  if (!target) return undefined;
  if (target.implementationPath) return target.implementationPath;
  if (target.phase === "read-model") return stage2ReadModelImplementationPath;

  return createExpectedWriteHandlerImplementationPath(auditPlan);
}

function validateTargetMatches(
  auditPlan: Stage2ActivationAuditPlan,
  evidence: Stage2ActivationEvidenceDraft,
): Stage2ActivationEvidenceBlocker[] {
  const target = auditPlan.target;
  if (!target) return [];

  return ([
    "phase",
    "moduleId",
    "workspaceId",
    "resource",
    "databaseAction",
  ] as const).flatMap((field) => (
    evidence[field] && evidence[field] !== target[field]
      ? [{
        code: "target_mismatch" as const,
        field,
        expected: target[field],
        actual: evidence[field],
      }]
      : []
  ));
}
