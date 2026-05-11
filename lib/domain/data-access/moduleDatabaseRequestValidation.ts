import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import {
  type WorkspaceModuleActionPreflightResult,
} from "../workspaces/moduleActionPreflight";
import {
  createModuleDatabaseAuthorizationContext,
} from "./moduleDatabaseAuthorization";
import {
  getModuleCreateMutationPlan,
  validateModuleCreatePayload,
} from "./moduleCreateMutationPlans";
import {
  getModulePatchMutationPlan,
  type ModulePatchMutationAction,
  validateModulePatchPayload,
} from "./modulePatchMutationPlans";
import {
  getModuleExportPlan,
  isModuleExportFormatAllowed,
} from "./moduleExportPlans";
import { validateModuleWorkflowTransitionPayload } from "./moduleWorkflowTransitions";
import type {
  WorkspaceModuleDatabaseRequestFailure,
  WorkspaceModuleDatabaseRequestInput,
  WorkspaceModuleDatabaseRequestPayload,
} from "./moduleDatabaseRequests";

const patchPayloadActions: WorkspaceModuleAccessAction[] = ["edit", "approve", "delete", "admin"];

function requiresPatchPayload(
  action: WorkspaceModuleAccessAction,
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>,
) {
  return patchPayloadActions.includes(action) && preflight.persistenceContract.patchOnly;
}

function validatePatchPayload(
  input: WorkspaceModuleDatabaseRequestInput,
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>,
): WorkspaceModuleDatabaseRequestFailure[] {
  if (!requiresPatchPayload(input.action, preflight)) return [];

  if (!input.patch) {
    return [{
      code: "patch_payload_required",
      message: "Patch-only module actions must send a versioned patch command.",
      field: "patch",
    }];
  }

  if (input.patch.changes.length === 0) {
    return [{
      code: "patch_payload_empty",
      message: "Patch-only module actions must include at least one changed field.",
      field: "patch.changes",
    }];
  }

  const patchPlan = getModulePatchMutationPlan(input.moduleId, input.action as ModulePatchMutationAction);
  if (!patchPlan) {
    return [{
      code: "patch_plan_missing",
      message: "Patch-only module actions must have a mutation plan.",
      field: "moduleId",
    }];
  }

  return validateModulePatchPayload(patchPlan, input.patch).map((issue) => ({
    code: issue.code,
    message: issue.message,
    field: `patch.changes.${issue.field}`,
  }));
}

function validateSectionScope(
  input: WorkspaceModuleDatabaseRequestInput,
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>,
): WorkspaceModuleDatabaseRequestFailure[] {
  const authorizationContext = createModuleDatabaseAuthorizationContext({
    resource: preflight.databaseResource,
    action: preflight.databaseAction,
    payload: createWorkspaceModuleDatabaseRequestPayloadDraft(input, preflight),
  });

  if (!authorizationContext?.missingSectionScope) return [];

  return [{
    code: "section_scope_required",
    message: "Section-scoped module actions must include sectionId or section_id for access-matrix checks.",
    field: "sectionId",
  }];
}

function validateCreatePayload(
  input: WorkspaceModuleDatabaseRequestInput,
): WorkspaceModuleDatabaseRequestFailure[] {
  if (input.action !== "create") return [];

  const plan = getModuleCreateMutationPlan(input.moduleId);
  if (!plan) {
    return [{
      code: "create_plan_missing",
      message: "Create actions must have a versioned create mutation plan.",
      field: "moduleId",
    }];
  }

  const dataWithScope = {
    ...input.data,
    sectionId: input.sectionId ?? input.data?.sectionId,
  };

  return validateModuleCreatePayload(plan, dataWithScope).map((issue) => ({
    code: issue.code,
    message: issue.message,
    field: `data.${issue.field}`,
  }));
}

function validateWorkflowTransitionPayload(
  input: WorkspaceModuleDatabaseRequestInput,
): WorkspaceModuleDatabaseRequestFailure[] {
  if (input.action !== "approve" || !input.patch) return [];

  return validateModuleWorkflowTransitionPayload({
    moduleId: input.moduleId,
    patch: input.patch,
    access: input.access,
    reason: input.reason,
  }).map((issue) => ({
    code: issue.code,
    message: issue.message,
    field: issue.field,
  }));
}

function validateExportPayload(
  input: WorkspaceModuleDatabaseRequestInput,
): WorkspaceModuleDatabaseRequestFailure[] {
  if (input.action !== "export") return [];

  const plan = getModuleExportPlan(input.moduleId);
  if (!plan) {
    return [{
      code: "export_plan_missing",
      message: "Export actions must have a bounded export plan.",
      field: "moduleId",
    }];
  }

  const format = input.data?.format;
  if (typeof format !== "string" || !format.trim()) {
    return [{
      code: "export_format_required",
      message: "Export actions must include an explicit output format.",
      field: "data.format",
    }];
  }

  if (!isModuleExportFormatAllowed(input.moduleId, format)) {
    return [{
      code: "export_format_unsupported",
      message: "Export format is not allowed for this module.",
      field: "data.format",
    }];
  }

  return [];
}

export function createWorkspaceModuleDatabaseRequestPayloadDraft(
  input: WorkspaceModuleDatabaseRequestInput,
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>,
): WorkspaceModuleDatabaseRequestPayload {
  return {
    moduleId: input.moduleId,
    workspaceId: preflight.moduleItem.workspaceId,
    accessAction: input.action,
    query: input.query,
    scope: {
      sectionId: input.sectionId,
    },
    data: input.data ?? {},
    patch: input.patch,
    requestMeta: {
      requestId: input.requestId,
      actorUserId: input.actorUserId,
      reason: input.reason,
    },
  };
}

export function validateWorkspaceModuleDatabaseRequestPayload(
  input: WorkspaceModuleDatabaseRequestInput,
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>,
): WorkspaceModuleDatabaseRequestFailure[] {
  return [
    ...validatePatchPayload(input, preflight),
    ...validateSectionScope(input, preflight),
    ...validateCreatePayload(input),
    ...validateWorkflowTransitionPayload(input),
    ...validateExportPayload(input),
  ];
}
