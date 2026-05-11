import type {
  AccessCapability,
  AccessMatrixGrant,
  DispatchServiceRoleId,
} from "./accessMatrix";
import { getWorkspaceModuleAccessPolicy } from "./moduleAccessPolicies";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type AccessMatrixReviewIssueCode =
  | "subject_missing"
  | "capability_without_view"
  | "elevated_reason_missing"
  | "contractor_elevated_access"
  | "contractor_export_access"
  | "module_workspace_mismatch"
  | "module_capability_not_supported"
  | "section_scope_missing"
  | "duplicate_grant_scope";

export type AccessMatrixReviewSeverity = "blocker" | "warning";

export type AccessMatrixReviewIssue = {
  code: AccessMatrixReviewIssueCode;
  severity: AccessMatrixReviewSeverity;
  message: string;
  grantId?: string;
  grantIds?: string[];
  capability?: AccessCapability;
};

export type AccessMatrixReviewSummary = Record<AccessMatrixReviewSeverity, number> & {
  total: number;
};

const capabilityFields = {
  view: "canView",
  edit: "canEdit",
  approve: "canApprove",
  delete: "canDelete",
  export: "canExport",
  admin: "canAdmin",
} as const satisfies Record<AccessCapability, keyof Pick<
  AccessMatrixGrant,
  "canView" | "canEdit" | "canApprove" | "canDelete" | "canExport" | "canAdmin"
>>;

const unscopedSectionRoles: Partial<Record<DispatchWorkspaceId, ReadonlySet<DispatchServiceRoleId>>> = {
  "mining-dispatch": new Set(["dispatch-chief", "system-admin"]),
  taxation: new Set(["dispatch-chief", "system-admin", "senior-taxation-dispatcher"]),
  "smts-gps": new Set(["dispatch-chief", "system-admin", "smts-admin"]),
  fleet: new Set(["dispatch-chief", "system-admin"]),
  "common-processes": new Set(["dispatch-chief", "system-admin"]),
  reports: new Set(["dispatch-chief", "system-admin"]),
};

export function reviewAccessMatrixGrants(
  grants: readonly AccessMatrixGrant[],
): AccessMatrixReviewIssue[] {
  const issues = grants.flatMap(reviewSingleGrant);
  issues.push(...findDuplicateGrantScopeIssues(grants));
  return issues;
}

export function summarizeAccessMatrixReviewIssues(
  issues: readonly AccessMatrixReviewIssue[],
): AccessMatrixReviewSummary {
  return issues.reduce<AccessMatrixReviewSummary>((summary, issue) => ({
    ...summary,
    total: summary.total + 1,
    [issue.severity]: summary[issue.severity] + 1,
  }), {
    total: 0,
    blocker: 0,
    warning: 0,
  });
}

function reviewSingleGrant(grant: AccessMatrixGrant): AccessMatrixReviewIssue[] {
  const issues: AccessMatrixReviewIssue[] = [];

  if (!grant.userId?.trim() && !grant.roleId) {
    issues.push({
      code: "subject_missing",
      severity: "blocker",
      grantId: grant.id,
      message: "Access grant must target a user or role.",
    });
  }

  for (const capability of listEnabledCapabilities(grant)) {
    if (capability !== "view" && !grant.canView) {
      issues.push({
        code: "capability_without_view",
        severity: "blocker",
        grantId: grant.id,
        capability,
        message: "Non-view capability requires view access.",
      });
    }
  }

  if ((grant.canDelete || grant.canAdmin) && !grant.reason?.trim()) {
    issues.push({
      code: "elevated_reason_missing",
      severity: "blocker",
      grantId: grant.id,
      message: "Delete or admin access must keep a reason for audit.",
    });
  }

  if (grant.roleId === "contractor") {
    if (grant.canEdit || grant.canApprove || grant.canDelete || grant.canAdmin) {
      issues.push({
        code: "contractor_elevated_access",
        severity: "blocker",
        grantId: grant.id,
        message: "Contractor access must stay read-only unless a separate limited workflow is introduced.",
      });
    }

    if (grant.canExport) {
      issues.push({
        code: "contractor_export_access",
        severity: "warning",
        grantId: grant.id,
        message: "Contractor export access should be reviewed separately from normal view access.",
      });
    }
  }

  if (grant.moduleId) {
    issues.push(...reviewModuleGrant(grant));
  }

  return issues;
}

function reviewModuleGrant(grant: AccessMatrixGrant): AccessMatrixReviewIssue[] {
  const policy = getWorkspaceModuleAccessPolicy(grant.moduleId ?? "");
  if (!policy) {
    return [];
  }

  const issues: AccessMatrixReviewIssue[] = [];
  if (policy.workspaceId !== grant.workspaceId) {
    issues.push({
      code: "module_workspace_mismatch",
      severity: "blocker",
      grantId: grant.id,
      message: "Access grant workspace does not match the module access policy.",
    });
  }

  const allowedCapabilities = new Set(Object.values(policy.actionCapabilities));
  for (const capability of listEnabledCapabilities(grant)) {
    if (!allowedCapabilities.has(capability)) {
      issues.push({
        code: "module_capability_not_supported",
        severity: "warning",
        grantId: grant.id,
        capability,
        message: "Grant enables a capability that the module policy does not expose.",
      });
    }
  }

  if (
    policy.sectionScoped
    && !grant.sectionId?.trim()
    && !canHoldUnscopedSectionGrant(grant)
  ) {
    issues.push({
      code: "section_scope_missing",
      severity: "warning",
      grantId: grant.id,
      message: "Section-scoped module grant should include sectionId for this subject.",
    });
  }

  return issues;
}

function canHoldUnscopedSectionGrant(grant: AccessMatrixGrant): boolean {
  if (grant.canAdmin) {
    return true;
  }

  if (!grant.roleId) {
    return false;
  }

  return Boolean(unscopedSectionRoles[grant.workspaceId]?.has(grant.roleId));
}

function findDuplicateGrantScopeIssues(
  grants: readonly AccessMatrixGrant[],
): AccessMatrixReviewIssue[] {
  const byScope = new Map<string, string[]>();
  for (const grant of grants) {
    const key = createGrantScopeKey(grant);
    byScope.set(key, [...(byScope.get(key) ?? []), grant.id]);
  }

  return [...byScope.values()].flatMap((grantIds) => (
    grantIds.length > 1
      ? [{
          code: "duplicate_grant_scope" as const,
          severity: "warning" as const,
          grantIds,
          message: "Multiple access grants target the same subject and scope.",
        }]
      : []
  ));
}

function listEnabledCapabilities(grant: AccessMatrixGrant): AccessCapability[] {
  return (Object.entries(capabilityFields) as Array<[AccessCapability, keyof AccessMatrixGrant]>)
    .flatMap(([capability, field]) => (grant[field] ? [capability] : []));
}

function createGrantScopeKey(grant: AccessMatrixGrant): string {
  return [
    grant.userId ?? "",
    grant.roleId ?? "",
    grant.workspaceId,
    grant.sectionId ?? "",
    grant.moduleId ?? "",
    grant.tabId ?? "",
  ].join("|");
}
