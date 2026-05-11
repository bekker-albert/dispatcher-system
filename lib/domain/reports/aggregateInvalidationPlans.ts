import {
  getModuleCreateMutationPlan,
} from "../data-access/moduleCreateMutationPlans";
import {
  getModuleImportPlan,
} from "../data-access/moduleImportPlans";
import {
  getModulePatchMutationPlan,
} from "../data-access/modulePatchMutationPlans";
import type { WorkspaceQueuedOperationTrigger } from "../workspaces/queuedOperations";
import {
  createReportAggregateInvalidationEnvelope,
  type ReportAggregateInvalidationReason,
  type ReportAggregateInvalidationResult,
} from "./aggregateInvalidation";
import type { ReportAggregationGrain } from "./aggregation-contracts";
import {
  getReportAggregateRefreshSourcePlan,
  reportAggregateRefreshSourcePlans,
} from "./aggregateRefreshSources";

export type ReportAggregateInvalidationMutationKind =
  | "create"
  | "import-accepted"
  | "patch"
  | "workflow-transition";

export type ReportAggregateInvalidationPlan = {
  sourceModuleId: string;
  mutationKind: ReportAggregateInvalidationMutationKind;
  databaseAction: string;
  invalidationReason: ReportAggregateInvalidationReason;
  defaultGrain: ReportAggregationGrain;
  requiresEntityId: true;
  requiresPeriod: true;
  requiresSourceVersion: true;
  derivesFromVersionedWrite: true;
  queuesBoundedRefresh: true;
  noFullReportRebuild: true;
};

export type ReportAggregateMutationWriteContext = {
  id: string;
  entityId: string;
  changedBy: string;
  changedAt: string;
  periodStart?: string;
  periodEnd?: string;
  sectionId?: string;
  sourceVersion?: string;
  changedFields?: readonly string[];
  estimatedInputRows?: number;
  grain?: ReportAggregationGrain;
  trigger?: WorkspaceQueuedOperationTrigger;
};

export type ReportAggregateInvalidationPlanIssue = {
  sourceModuleId: string;
  mutationKind: ReportAggregateInvalidationMutationKind;
  code:
    | "grain_not_allowed"
    | "invalidation_plan_without_guards"
    | "mutation_action_mismatch"
    | "mutation_plan_missing"
    | "source_plan_missing";
  value?: string;
};

function createInvalidationPlan(input: Omit<
  ReportAggregateInvalidationPlan,
  | "requiresEntityId"
  | "requiresPeriod"
  | "requiresSourceVersion"
  | "derivesFromVersionedWrite"
  | "queuesBoundedRefresh"
  | "noFullReportRebuild"
>) {
  return {
    requiresEntityId: true,
    requiresPeriod: true,
    requiresSourceVersion: true,
    derivesFromVersionedWrite: true,
    queuesBoundedRefresh: true,
    noFullReportRebuild: true,
    ...input,
  } satisfies ReportAggregateInvalidationPlan;
}

export const reportAggregateInvalidationPlans: ReportAggregateInvalidationPlan[] = [
  createInvalidationPlan({
    sourceModuleId: "mining-operational-accounting",
    mutationKind: "patch",
    databaseAction: "patch-operational-accounting-row",
    invalidationReason: "patch-saved",
    defaultGrain: "shift",
  }),
  createInvalidationPlan({
    sourceModuleId: "taxation-fuel-periods",
    mutationKind: "create",
    databaseAction: "create-fuel-period",
    invalidationReason: "create-saved",
    defaultGrain: "fuel_period",
  }),
  createInvalidationPlan({
    sourceModuleId: "taxation-fuel-periods",
    mutationKind: "patch",
    databaseAction: "patch-fuel-period",
    invalidationReason: "patch-saved",
    defaultGrain: "fuel_period",
  }),
  createInvalidationPlan({
    sourceModuleId: "taxation-fuel-periods",
    mutationKind: "workflow-transition",
    databaseAction: "transition-fuel-period",
    invalidationReason: "workflow-transition",
    defaultGrain: "fuel_period",
  }),
  createInvalidationPlan({
    sourceModuleId: "taxation-fuel-periods",
    mutationKind: "import-accepted",
    databaseAction: "stage-fuel-statement-import",
    invalidationReason: "import-accepted",
    defaultGrain: "fuel_period",
  }),
  createInvalidationPlan({
    sourceModuleId: "smts-fuel-drains",
    mutationKind: "patch",
    databaseAction: "patch-fuel-drain-event",
    invalidationReason: "patch-saved",
    defaultGrain: "day",
  }),
  createInvalidationPlan({
    sourceModuleId: "smts-fuel-drains",
    mutationKind: "workflow-transition",
    databaseAction: "transition-fuel-drain-event",
    invalidationReason: "workflow-transition",
    defaultGrain: "day",
  }),
  createInvalidationPlan({
    sourceModuleId: "fleet-movements",
    mutationKind: "create",
    databaseAction: "create-vehicle-movement",
    invalidationReason: "create-saved",
    defaultGrain: "day",
  }),
  createInvalidationPlan({
    sourceModuleId: "fleet-movements",
    mutationKind: "patch",
    databaseAction: "patch-vehicle-movement",
    invalidationReason: "patch-saved",
    defaultGrain: "day",
  }),
  createInvalidationPlan({
    sourceModuleId: "fleet-movements",
    mutationKind: "workflow-transition",
    databaseAction: "transition-vehicle-movement",
    invalidationReason: "workflow-transition",
    defaultGrain: "day",
  }),
  createInvalidationPlan({
    sourceModuleId: "fleet-movements",
    mutationKind: "import-accepted",
    databaseAction: "stage-vehicle-movement-import",
    invalidationReason: "import-accepted",
    defaultGrain: "day",
  }),
];

export function getReportAggregateInvalidationPlan(
  sourceModuleId: string,
  mutationKind: ReportAggregateInvalidationMutationKind,
) {
  return reportAggregateInvalidationPlans.find((plan) => (
    plan.sourceModuleId === sourceModuleId && plan.mutationKind === mutationKind
  ));
}

export function listReportAggregateInvalidationPlans(sourceModuleId?: string) {
  return reportAggregateInvalidationPlans.filter((plan) => (
    sourceModuleId ? plan.sourceModuleId === sourceModuleId : true
  ));
}

function getExpectedDatabaseAction(plan: ReportAggregateInvalidationPlan) {
  if (plan.mutationKind === "create") {
    return getModuleCreateMutationPlan(plan.sourceModuleId)?.databaseAction;
  }

  if (plan.mutationKind === "patch") {
    return getModulePatchMutationPlan(plan.sourceModuleId, "edit")?.databaseAction;
  }

  if (plan.mutationKind === "workflow-transition") {
    return getModulePatchMutationPlan(plan.sourceModuleId, "approve")?.databaseAction;
  }

  return getModuleImportPlan(plan.sourceModuleId)?.databaseAction;
}

export function validateReportAggregateInvalidationPlan(
  plan: ReportAggregateInvalidationPlan,
): ReportAggregateInvalidationPlanIssue[] {
  const issues: ReportAggregateInvalidationPlanIssue[] = [];
  const sourcePlan = getReportAggregateRefreshSourcePlan(plan.sourceModuleId);
  const expectedDatabaseAction = getExpectedDatabaseAction(plan);

  if (!sourcePlan) {
    issues.push({
      sourceModuleId: plan.sourceModuleId,
      mutationKind: plan.mutationKind,
      code: "source_plan_missing",
    });
  } else if (!sourcePlan.allowedGrains.includes(plan.defaultGrain)) {
    issues.push({
      sourceModuleId: plan.sourceModuleId,
      mutationKind: plan.mutationKind,
      code: "grain_not_allowed",
      value: plan.defaultGrain,
    });
  }

  if (!expectedDatabaseAction) {
    issues.push({
      sourceModuleId: plan.sourceModuleId,
      mutationKind: plan.mutationKind,
      code: "mutation_plan_missing",
    });
  } else if (expectedDatabaseAction !== plan.databaseAction) {
    issues.push({
      sourceModuleId: plan.sourceModuleId,
      mutationKind: plan.mutationKind,
      code: "mutation_action_mismatch",
      value: plan.databaseAction,
    });
  }

  if (
    !plan.requiresEntityId ||
    !plan.requiresPeriod ||
    !plan.requiresSourceVersion ||
    !plan.derivesFromVersionedWrite ||
    !plan.queuesBoundedRefresh ||
    !plan.noFullReportRebuild
  ) {
    issues.push({
      sourceModuleId: plan.sourceModuleId,
      mutationKind: plan.mutationKind,
      code: "invalidation_plan_without_guards",
    });
  }

  return issues;
}

export function getInvalidReportAggregateInvalidationPlans() {
  return reportAggregateInvalidationPlans.flatMap(validateReportAggregateInvalidationPlan);
}

export function getRefreshSourceModulesWithoutInvalidationPlans() {
  const invalidationModuleIds = new Set(reportAggregateInvalidationPlans.map((plan) => plan.sourceModuleId));

  return reportAggregateRefreshSourcePlans.filter((plan) => (
    !invalidationModuleIds.has(plan.sourceModuleId)
  ));
}

export function createReportAggregateInvalidationEnvelopeFromMutation(
  plan: ReportAggregateInvalidationPlan,
  context: ReportAggregateMutationWriteContext,
): ReportAggregateInvalidationResult {
  const planIssues = validateReportAggregateInvalidationPlan(plan);

  if (planIssues.length > 0) {
    return {
      ok: false,
      rejection: {
        code: "aggregate_invalidation_invalid",
        message: "Report aggregate invalidation plan is not ready for a bounded refresh.",
        issues: planIssues.map((issue) => ({
          code: issue.code === "grain_not_allowed" ? "grain_not_allowed" : "source_plan_missing",
          severity: "blocker" as const,
          message: "Aggregate invalidation plan is invalid.",
        })),
      },
    };
  }

  return createReportAggregateInvalidationEnvelope({
    id: context.id,
    sourceModuleId: plan.sourceModuleId,
    entityId: context.entityId,
    changedBy: context.changedBy,
    changedAt: context.changedAt,
    reason: plan.invalidationReason,
    trigger: context.trigger ?? "event-driven",
    grain: context.grain ?? plan.defaultGrain,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    sectionId: context.sectionId,
    sourceVersion: context.sourceVersion,
    changedFields: context.changedFields,
    estimatedInputRows: context.estimatedInputRows,
  });
}
