import {
  getModuleHandlerImplementationBlockers,
  getModuleHandlerImplementationDependencyIssues,
  getNextModuleHandlerImplementationBatch,
  listModuleHandlerImplementationPlan,
  type ModuleHandlerImplementationPhase,
} from "../data-access/moduleHandlerImplementationPlan";
import { getModuleLiveHandlerStatus } from "../data-access/moduleLiveHandlerRegistry";
import { createModuleHandlerRuntimeContract } from "../data-access/moduleHandlerRuntimeContracts";
import type { DispatchWorkspaceId } from "./workspaces";

export type WorkspaceHandlerRolloutSummary = {
  workspaceId: DispatchWorkspaceId;
  totalActions: number;
  readyActions: number;
  blockedActions: number;
  runtimeBlockedActions: number;
  dependencyIssues: number;
  nextPhase?: ModuleHandlerImplementationPhase;
  nextBatchSize: number;
  phaseCounts: Record<ModuleHandlerImplementationPhase, number>;
  writeWorkflowActions: number;
  plannedWriteActions: number;
  liveWriteActions: number;
  writePlanningOnly: boolean;
  readyToStartImplementation: boolean;
};

const emptyPhaseCounts: Record<ModuleHandlerImplementationPhase, number> = {
  "read-model": 0,
  "export-queue": 0,
  "import-staging": 0,
  "write-workflow": 0,
};

export function createWorkspaceHandlerRolloutSummary(
  workspaceId: DispatchWorkspaceId,
): WorkspaceHandlerRolloutSummary {
  const plan = listModuleHandlerImplementationPlan(workspaceId);
  const blockers = getModuleHandlerImplementationBlockers(workspaceId);
  const dependencyIssues = getModuleHandlerImplementationDependencyIssues(workspaceId);
  const nextBatch = getNextModuleHandlerImplementationBatch(workspaceId, 8);
  const runtimeBlockedActions = plan.filter((entry) => (
    !createModuleHandlerRuntimeContract(entry.resource, entry.databaseAction).readyToConnectHandler
  )).length;
  const phaseCounts = plan.reduce<Record<ModuleHandlerImplementationPhase, number>>(
    (counts, entry) => ({
      ...counts,
      [entry.phase]: counts[entry.phase] + 1,
    }),
    { ...emptyPhaseCounts },
  );
  const writeWorkflowActions = plan.filter((entry) => entry.phase === "write-workflow");
  const liveWriteActions = writeWorkflowActions.filter((entry) => (
    getModuleLiveHandlerStatus(entry.resource, entry.databaseAction)?.status === "live"
  )).length;

  return {
    workspaceId,
    totalActions: plan.length,
    readyActions: plan.filter((entry) => entry.implementationReady).length,
    blockedActions: blockers.length,
    runtimeBlockedActions,
    dependencyIssues: dependencyIssues.length,
    nextPhase: nextBatch[0]?.phase,
    nextBatchSize: nextBatch.length,
    phaseCounts,
    writeWorkflowActions: writeWorkflowActions.length,
    plannedWriteActions: writeWorkflowActions.length - liveWriteActions,
    liveWriteActions,
    writePlanningOnly: liveWriteActions === 0,
    readyToStartImplementation: plan.length > 0
      && blockers.length === 0
      && dependencyIssues.length === 0
      && runtimeBlockedActions === 0
      && nextBatch.length > 0,
  };
}
