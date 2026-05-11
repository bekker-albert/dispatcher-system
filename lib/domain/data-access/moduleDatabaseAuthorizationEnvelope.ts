import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import { hasAccessCapability } from "../access-control/effectivePermissions";
import {
  createModuleDatabaseAuthorizationContext,
  type ModuleDatabaseAuthorizationContext,
  type ModuleDatabaseAuthorizationRequest,
} from "./moduleDatabaseAuthorization";

export type ModuleDatabaseAuthorizationEnvelopeIssueCode =
  | "not_module_database_action"
  | "missing_section_scope"
  | "access_denied";

export type ModuleDatabaseAuthorizationEnvelopeIssue = {
  code: ModuleDatabaseAuthorizationEnvelopeIssueCode;
  severity: "blocker" | "warning";
  message: string;
  field?: string;
};

export type ModuleDatabaseAuthorizationEnvelope = {
  moduleId: string;
  workspaceId: ModuleDatabaseAuthorizationContext["requirement"]["workspaceId"];
  resource: string;
  databaseAction: string;
  accessAction: ModuleDatabaseAuthorizationContext["requirement"]["accessAction"];
  requiredCapability: ModuleDatabaseAuthorizationContext["requirement"]["requiredCapability"];
  sectionScoped: boolean;
  sectionId?: string;
  accessMatrixRequired: true;
  matchedGrantIds: string[];
};

export type ModuleDatabaseAuthorizationEnvelopeRejection = {
  code: "module_database_authorization_invalid";
  message: string;
  issues: ModuleDatabaseAuthorizationEnvelopeIssue[];
};

export type ModuleDatabaseAuthorizationEnvelopeResult =
  | { ok: true; envelope: ModuleDatabaseAuthorizationEnvelope }
  | { ok: false; rejection: ModuleDatabaseAuthorizationEnvelopeRejection };

export type ModuleDatabaseAuthorizationEnvelopeDraft = {
  request: ModuleDatabaseAuthorizationRequest;
  access: EffectiveAccessDecision;
};

function createRejection(
  issues: ModuleDatabaseAuthorizationEnvelopeIssue[],
): ModuleDatabaseAuthorizationEnvelopeRejection {
  return {
    code: "module_database_authorization_invalid",
    message: "Module database action does not satisfy the access matrix authorization contract.",
    issues,
  };
}

export function validateModuleDatabaseAuthorizationEnvelopeDraft(
  draft: ModuleDatabaseAuthorizationEnvelopeDraft,
): ModuleDatabaseAuthorizationEnvelopeIssue[] {
  const context = createModuleDatabaseAuthorizationContext(draft.request);

  if (!context) {
    return [{
      code: "not_module_database_action",
      severity: "blocker",
      message: "Request is not registered as a module database action.",
      field: "action",
    }];
  }

  const issues: ModuleDatabaseAuthorizationEnvelopeIssue[] = [];

  if (context.missingSectionScope) {
    issues.push({
      code: "missing_section_scope",
      severity: "blocker",
      message: "Section-scoped module action requires an explicit section scope.",
      field: "sectionId",
    });
  }

  if (!hasAccessCapability(draft.access, context.requirement.requiredCapability)) {
    issues.push({
      code: "access_denied",
      severity: "blocker",
      message: "Effective access does not include the database action required capability.",
      field: context.requirement.requiredCapability,
    });
  }

  return issues;
}

export function createModuleDatabaseAuthorizationEnvelope(
  draft: ModuleDatabaseAuthorizationEnvelopeDraft,
): ModuleDatabaseAuthorizationEnvelopeResult {
  const context = createModuleDatabaseAuthorizationContext(draft.request);
  const issues = validateModuleDatabaseAuthorizationEnvelopeDraft(draft);

  if (!context || issues.length > 0) {
    return {
      ok: false,
      rejection: createRejection(issues),
    };
  }

  return {
    ok: true,
    envelope: {
      moduleId: context.requirement.moduleId,
      workspaceId: context.requirement.workspaceId,
      resource: context.requirement.resource,
      databaseAction: context.requirement.databaseAction,
      accessAction: context.requirement.accessAction,
      requiredCapability: context.requirement.requiredCapability,
      sectionScoped: context.requirement.sectionScoped,
      ...(context.sectionId ? { sectionId: context.sectionId } : {}),
      accessMatrixRequired: true,
      matchedGrantIds: draft.access.matchedGrantIds,
    },
  };
}
