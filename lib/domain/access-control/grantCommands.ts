import type { PatchSaveCommand } from "../editing/patchEditing";
import type {
  AccessCapability,
  AccessMatrixGrant,
  DispatchServiceRoleId,
} from "./accessMatrix";

export type AccessMatrixGrantCapabilities = {
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  canExport: boolean;
  canAdmin: boolean;
};

export type AccessMatrixGrantDraft = {
  userId?: string;
  roleId?: DispatchServiceRoleId;
  sectionId?: string;
  workspaceId: AccessMatrixGrant["workspaceId"];
  moduleId?: string;
  tabId?: AccessMatrixGrant["tabId"];
  capabilities: Partial<Record<AccessCapability, boolean>>;
  reason?: string;
};

export type AccessGrantValidationCode =
  | "subject_required"
  | "workspace_required"
  | "capability_required"
  | "elevated_reason_required";

export type AccessGrantValidationIssue = {
  code: AccessGrantValidationCode;
  message: string;
};

export type AccessMatrixGrantCreateCommand = {
  entityType: "access_matrix_grant";
  grant: Omit<AccessMatrixGrant, "id" | "version" | "updatedAt" | "updatedBy">;
};

export type AccessMatrixGrantCreateResult =
  | { ok: true; command: AccessMatrixGrantCreateCommand }
  | {
      ok: false;
      rejection: {
        code: "grant_invalid";
        message: string;
        issues: AccessGrantValidationIssue[];
      };
    };

const capabilityToField = {
  view: "canView",
  edit: "canEdit",
  approve: "canApprove",
  delete: "canDelete",
  export: "canExport",
  admin: "canAdmin",
} as const satisfies Record<AccessCapability, keyof AccessMatrixGrantCapabilities>;

const emptyCapabilities: AccessMatrixGrantCapabilities = {
  canView: false,
  canEdit: false,
  canApprove: false,
  canDelete: false,
  canExport: false,
  canAdmin: false,
};

export const normalizeAccessGrantCapabilities = (
  capabilities: Partial<Record<AccessCapability, boolean>>,
): AccessMatrixGrantCapabilities => {
  const normalized = { ...emptyCapabilities };

  for (const [capability, field] of Object.entries(capabilityToField) as Array<[AccessCapability, keyof AccessMatrixGrantCapabilities]>) {
    normalized[field] = Boolean(capabilities[capability]);
  }

  if (normalized.canAdmin) {
    return {
      canView: true,
      canEdit: true,
      canApprove: true,
      canDelete: true,
      canExport: true,
      canAdmin: true,
    };
  }

  if (normalized.canEdit || normalized.canApprove || normalized.canDelete || normalized.canExport) {
    normalized.canView = true;
  }

  return normalized;
};

export const validateAccessMatrixGrantDraft = (
  draft: AccessMatrixGrantDraft,
): AccessGrantValidationIssue[] => {
  const issues: AccessGrantValidationIssue[] = [];
  const capabilities = normalizeAccessGrantCapabilities(draft.capabilities);

  if (!draft.userId?.trim() && !draft.roleId) {
    issues.push({
      code: "subject_required",
      message: "Access grant must target a user or role.",
    });
  }

  if (!draft.workspaceId) {
    issues.push({
      code: "workspace_required",
      message: "Access grant workspace is required.",
    });
  }

  if (!Object.values(capabilities).some(Boolean)) {
    issues.push({
      code: "capability_required",
      message: "Access grant must include at least one capability.",
    });
  }

  if ((capabilities.canDelete || capabilities.canAdmin) && !draft.reason?.trim()) {
    issues.push({
      code: "elevated_reason_required",
      message: "Delete or admin access requires a reason.",
    });
  }

  return issues;
};

export const createAccessMatrixGrantCreateCommand = (
  draft: AccessMatrixGrantDraft,
): AccessMatrixGrantCreateResult => {
  const issues = validateAccessMatrixGrantDraft(draft);

  if (issues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "grant_invalid",
        message: "Access matrix grant is invalid.",
        issues,
      },
    };
  }

  return {
    ok: true,
    command: {
      entityType: "access_matrix_grant",
      grant: {
        userId: draft.userId,
        roleId: draft.roleId,
        sectionId: draft.sectionId,
        workspaceId: draft.workspaceId,
        moduleId: draft.moduleId,
        tabId: draft.tabId,
        ...normalizeAccessGrantCapabilities(draft.capabilities),
        reason: draft.reason,
      },
    },
  };
};

export const createAccessMatrixGrantPatchCommand = (
  grant: AccessMatrixGrant,
  nextCapabilities: Partial<Record<AccessCapability, boolean>>,
  reason?: string,
): PatchSaveCommand => {
  const normalized = normalizeAccessGrantCapabilities(nextCapabilities);
  const changes = (Object.values(capabilityToField) as Array<keyof AccessMatrixGrantCapabilities>)
    .flatMap((field) => (
      grant[field] === normalized[field]
        ? []
        : [{
            field,
            previousValue: grant[field],
            nextValue: normalized[field],
          }]
    ));

  return {
    entityType: "access_matrix_grant",
    entity: {
      id: grant.id,
      version: grant.version,
      updatedAt: grant.updatedAt,
      updatedBy: grant.updatedBy,
    },
    changes,
    reason,
  };
};
