import type { EffectiveAccessDecision } from "../access-control/effectivePermissions";
import type { PatchSaveCommand } from "../editing/patchEditing";
import type {
  WorkspaceModuleActionPreflightFailure,
  WorkspaceModuleActionPreflightResult,
} from "../workspaces/moduleActionPreflight";
import { preflightWorkspaceModuleAction } from "../workspaces/moduleActionPreflight";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  resolveModuleDatabaseSectionId,
} from "./moduleDatabaseAuthorization";
import {
  createWorkspaceModuleDatabaseRequestPayloadDraft,
  validateWorkspaceModuleDatabaseRequestPayload,
} from "./moduleDatabaseRequestValidation";
import type { ServerPageQuery } from "./pagination";
import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";

export type WorkspaceModuleDatabaseRequestPayload = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  accessAction: WorkspaceModuleAccessAction;
  query?: ServerPageQuery;
  scope?: {
    sectionId?: string;
  };
  data: Record<string, unknown>;
  patch?: PatchSaveCommand;
  requestMeta?: {
    requestId?: string;
    actorUserId?: string;
    reason?: string;
  };
};

export type WorkspaceModuleDatabaseRequest = {
  endpoint: "/api/database";
  resource: string;
  action: string;
  payload: WorkspaceModuleDatabaseRequestPayload;
};

export type WorkspaceModuleDatabaseRequestInput = {
  moduleId: string;
  action: WorkspaceModuleAccessAction;
  access: EffectiveAccessDecision;
  query?: ServerPageQuery;
  sectionId?: string;
  data?: Record<string, unknown>;
  patch?: PatchSaveCommand;
  requireQuery?: boolean;
  requestId?: string;
  actorUserId?: string;
  reason?: string;
};

export type WorkspaceModuleDatabaseRequestFailureCode =
  | WorkspaceModuleActionPreflightFailure["code"]
  | "patch_payload_required"
  | "patch_payload_empty"
  | "patch_plan_missing"
  | "patch_field_not_allowed"
  | "section_scope_required"
  | "create_plan_missing"
  | "create_field_group_missing"
  | "workflow_transition_plan_missing"
  | "workflow_status_patch_required"
  | "workflow_status_previous_required"
  | "workflow_status_next_required"
  | "workflow_transition_not_allowed"
  | "workflow_reason_required"
  | "workflow_approval_required"
  | "export_plan_missing"
  | "export_format_required"
  | "export_format_unsupported";

export type WorkspaceModuleDatabaseRequestFailure = {
  code: WorkspaceModuleDatabaseRequestFailureCode;
  message: string;
  field?: string;
};

export type WorkspaceModuleDatabaseRequestResult = {
  ok: true;
  preflight: Extract<WorkspaceModuleActionPreflightResult, { ok: true }>;
  request: WorkspaceModuleDatabaseRequest;
} | {
  ok: false;
  preflight: WorkspaceModuleActionPreflightResult;
  failures: WorkspaceModuleDatabaseRequestFailure[];
};

export function createWorkspaceModuleDatabaseRequest(
  input: WorkspaceModuleDatabaseRequestInput,
): WorkspaceModuleDatabaseRequestResult {
  const preflight = preflightWorkspaceModuleAction({
    moduleId: input.moduleId,
    action: input.action,
    access: input.access,
    query: input.query,
    requireQuery: input.requireQuery,
  });

  if (!preflight.ok) {
    return {
      ok: false,
      preflight,
      failures: preflight.failures,
    };
  }

  const payloadFailures = validateWorkspaceModuleDatabaseRequestPayload(input, preflight);
  if (payloadFailures.length > 0) {
    return {
      ok: false,
      preflight,
      failures: payloadFailures,
    };
  }

  const payloadDraft = createWorkspaceModuleDatabaseRequestPayloadDraft(input, preflight);
  const sectionId = resolveModuleDatabaseSectionId(payloadDraft);

  return {
    ok: true,
    preflight,
    request: {
      endpoint: preflight.databaseEndpoint,
      resource: preflight.databaseResource,
      action: preflight.databaseAction,
      payload: {
        ...payloadDraft,
        scope: {
          sectionId,
        },
      },
    },
  };
}
