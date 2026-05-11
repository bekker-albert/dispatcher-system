import type { WorkspaceImplementationRoadmapAction } from "./implementationRoadmap";
import { stage2ReadModelImplementationPath } from "./stage2ImplementationPaths";

export const stage2ReadModelVerifyCommand = "npm run verify" as const;

export { stage2ReadModelImplementationPath } from "./stage2ImplementationPaths";

export const stage2ReadModelRollbackPlan = "Remove the live registry key and guarded registration" as const;

export const stage2ReadModelActivationRule =
  "Activate exactly one Stage 2 read-model action at a time: schema preflight, activation preflight, verify, smoke, then the next action." as const;

export const stage2ReadModelPlannedSmokeExpectation = {
  plannedStatus: 501,
  plannedCode: "planned_module_database_action",
  plannedLiveHandlerStatus: "planned-only",
  liveStatus: 200,
} as const;

export function createStage2ReadModelSchemaPreflightCommand(
  action: WorkspaceImplementationRoadmapAction,
) {
  return `npm run check:read-model-schema -- --workspace ${action.workspaceId}`;
}

export function createStage2ReadModelActivationPreflightCommand(
  action: WorkspaceImplementationRoadmapAction,
  requestedBy: string,
) {
  return [
    "npm run review:live-handler --",
    `--resource ${action.resource}`,
    `--action ${action.databaseAction}`,
    `--requested-by ${requestedBy}`,
    `--reason "Connect bounded ${action.moduleId} ${action.databaseAction} read model"`,
    `--implementation-path ${stage2ReadModelImplementationPath}`,
    `--rollback-plan "${stage2ReadModelRollbackPlan}"`,
  ].join(" ");
}
