import type { WorkspaceModuleAccessAction } from "../access-control/moduleAccessPolicies";
import {
  reportAggregateInvalidationPlans,
} from "../reports/aggregateInvalidationPlans";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import {
  listModuleCreateMutationPlans,
  type ModuleCreateMutationPlan,
} from "./moduleCreateMutationPlans";
import {
  listModulePatchMutationPlans,
  type ModulePatchMutationPlan,
} from "./modulePatchMutationPlans";

export type ModuleWritePipelineKind =
  | "create"
  | "patch"
  | "workflow-transition";

export type ModuleWritePipelinePlan = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  resource: string;
  databaseAction: string;
  writeAction: WorkspaceModuleAccessAction;
  pipelineKind: ModuleWritePipelineKind;
  requiresAccessPreflight: true;
  requiresPayloadEnvelope: true;
  requiresAtomicTransaction: true;
  requiresChangeHistory: true;
  requiresPostCommitSideEffects: true;
  requiresExpectedVersion: boolean;
  requiresDuplicateCheck: boolean;
  maxEntityRowWrites: 1;
  queuesAggregateRefresh: boolean;
  noInlineReportRecalculation: true;
  noFullReportRebuild: true;
};

export type ModuleWritePipelinePlanIssue = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  databaseAction: string;
  code:
    | "aggregate_invalidation_without_write_pipeline"
    | "write_pipeline_without_guard"
    | "write_pipeline_without_transaction";
};

function hasAggregateInvalidationPlan(moduleId: string, databaseAction: string) {
  return reportAggregateInvalidationPlans.some((plan) => (
    plan.sourceModuleId === moduleId && plan.databaseAction === databaseAction
  ));
}

function createPipelineBase({
  moduleId,
  workspaceId,
  resource,
  databaseAction,
}: Pick<ModuleCreateMutationPlan | ModulePatchMutationPlan, "moduleId" | "workspaceId" | "resource" | "databaseAction">) {
  return {
    moduleId,
    workspaceId,
    resource,
    databaseAction,
    requiresAccessPreflight: true,
    requiresPayloadEnvelope: true,
    requiresAtomicTransaction: true,
    requiresChangeHistory: true,
    requiresPostCommitSideEffects: true,
    maxEntityRowWrites: 1,
    queuesAggregateRefresh: hasAggregateInvalidationPlan(moduleId, databaseAction),
    noInlineReportRecalculation: true,
    noFullReportRebuild: true,
  } as const;
}

function createPipelineFromCreatePlan(plan: ModuleCreateMutationPlan): ModuleWritePipelinePlan {
  return {
    ...createPipelineBase(plan),
    writeAction: "create",
    pipelineKind: "create",
    requiresExpectedVersion: false,
    requiresDuplicateCheck: plan.duplicateKeyGroups.length > 0,
  };
}

function createPipelineFromPatchPlan(plan: ModulePatchMutationPlan): ModuleWritePipelinePlan {
  return {
    ...createPipelineBase(plan),
    writeAction: plan.action,
    pipelineKind: plan.action === "approve" ? "workflow-transition" : "patch",
    requiresExpectedVersion: plan.requiresExpectedVersion,
    requiresDuplicateCheck: false,
  };
}

export function listModuleWritePipelinePlans(workspaceId?: DispatchWorkspaceId) {
  return [
    ...listModuleCreateMutationPlans(workspaceId).map(createPipelineFromCreatePlan),
    ...listModulePatchMutationPlans(workspaceId).map(createPipelineFromPatchPlan),
  ];
}

export function getModuleWritePipelinePlan(moduleId: string, databaseAction: string) {
  return listModuleWritePipelinePlans().find((plan) => (
    plan.moduleId === moduleId && plan.databaseAction === databaseAction
  ));
}

export function getWritePipelinePlansWithoutRequiredGuards(workspaceId?: DispatchWorkspaceId) {
  return listModuleWritePipelinePlans(workspaceId).flatMap((plan): ModuleWritePipelinePlanIssue[] => {
    const issues: ModuleWritePipelinePlanIssue[] = [];

    if (
      !plan.requiresAccessPreflight ||
      !plan.requiresPayloadEnvelope ||
      !plan.requiresChangeHistory ||
      !plan.requiresPostCommitSideEffects ||
      !plan.noInlineReportRecalculation ||
      !plan.noFullReportRebuild
    ) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        databaseAction: plan.databaseAction,
        code: "write_pipeline_without_guard",
      });
    }

    if (!plan.requiresAtomicTransaction || plan.maxEntityRowWrites !== 1) {
      issues.push({
        moduleId: plan.moduleId,
        workspaceId: plan.workspaceId,
        databaseAction: plan.databaseAction,
        code: "write_pipeline_without_transaction",
      });
    }

    return issues;
  });
}

export function getReportInvalidationPlansWithoutWritePipeline() {
  return reportAggregateInvalidationPlans.flatMap((invalidationPlan): ModuleWritePipelinePlanIssue[] => {
    if (invalidationPlan.mutationKind === "import-accepted") return [];

    const writePipeline = getModuleWritePipelinePlan(
      invalidationPlan.sourceModuleId,
      invalidationPlan.databaseAction,
    );

    return writePipeline
      ? []
      : [{
          moduleId: invalidationPlan.sourceModuleId,
          workspaceId: "reports",
          databaseAction: invalidationPlan.databaseAction,
          code: "aggregate_invalidation_without_write_pipeline",
        }];
  });
}
