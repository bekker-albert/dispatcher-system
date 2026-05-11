import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import { getHandlerImplementationGuardrailIssues } from "./handlerImplementationGuardrails";
import { getHandlerRuntimeGuardrailIssues } from "./handlerRuntimeGuardrails";
import { getImportGuardrailIssues } from "./importGuardrails";
import { getModuleDataRouteGuardrailIssues } from "./moduleDataRouteGuardrails";
import { getModuleListQueryGuardrailIssues } from "./moduleListQueryGuardrails";
import {
  getModulePersistencePresenceGuardrailIssues,
  getModuleWriteModelGuardrailIssues,
} from "./moduleWriteModelGuardrails";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";
import { getModuleReadModelGuardrailIssues } from "./moduleReadModelGuardrails";
import { getReportAggregateGuardrailIssues } from "./reportAggregateGuardrails";
import { getWorkflowTransitionGuardrailIssues } from "./workflowGuardrails";
import { getWritePipelineGuardrailIssues } from "./writePipelineGuardrails";

export function getWorkspaceModuleDataAccessGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  return [
    ...getModuleReadModelGuardrailIssues(module),
    ...getModulePersistencePresenceGuardrailIssues(module),
    ...getModuleDataRouteGuardrailIssues(module),
    ...getHandlerImplementationGuardrailIssues(module),
    ...getHandlerRuntimeGuardrailIssues(module),
    ...getModuleListQueryGuardrailIssues(module),
    ...getWorkflowTransitionGuardrailIssues(module),
    ...getModuleWriteModelGuardrailIssues(module),
    ...getWritePipelineGuardrailIssues(module),
    ...getReportAggregateGuardrailIssues(module),
    ...getImportGuardrailIssues(module),
  ];
}
