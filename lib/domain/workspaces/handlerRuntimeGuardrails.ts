import {
  createModuleHandlerRuntimeContract,
  type ModuleHandlerRuntimeRequirement,
} from "../data-access/moduleHandlerRuntimeContracts";
import { listModuleHandlerImplementationPlan } from "../data-access/moduleHandlerImplementationPlan";
import { listModuleLiveHandlerRegistry } from "../data-access/moduleLiveHandlerRegistry";
import type { WorkspaceGuardrailIssue } from "./guardrails";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

const baseRuntimeRequirements: ModuleHandlerRuntimeRequirement[] = [
  "single_database_router_dispatch",
  "authorization_before_handler",
];

export function getHandlerRuntimeGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const entries = listModuleHandlerImplementationPlan(module.workspaceId)
    .filter((entry) => entry.moduleId === module.id);
  const liveHandlers = listModuleLiveHandlerRegistry(module.workspaceId)
    .filter((entry) => entry.moduleId === module.id);
  const issues: WorkspaceGuardrailIssue[] = [];

  for (const entry of entries) {
    const runtimeContract = createModuleHandlerRuntimeContract(entry.resource, entry.databaseAction);

    if (runtimeContract.issues.includes("missing_implementation_gate")) {
      issues.push({
        moduleId: module.id,
        workspaceId: module.workspaceId,
        code: "handler_runtime_contract_missing",
        severity: "blocker",
        message: "Every planned module database action must have a runtime handler contract before implementation.",
      });
      continue;
    }

    if (!runtimeContract.readyToConnectHandler) {
      issues.push({
        moduleId: module.id,
        workspaceId: module.workspaceId,
        code: "handler_runtime_contract_blocked",
        severity: "blocker",
        message: "Runtime handler contract must not be connected while implementation gate issues remain.",
      });
    }

    if (!baseRuntimeRequirements.every((requirement) => runtimeContract.requirements.includes(requirement))) {
      issues.push({
        moduleId: module.id,
        workspaceId: module.workspaceId,
        code: "handler_runtime_contract_missing_base_requirement",
        severity: "blocker",
        message: "Runtime handler contract must require the shared database router and authorization before handler logic.",
      });
    }
  }

  for (const liveHandler of liveHandlers) {
    if (liveHandler.status !== "live" || liveHandler.activationIssues.length === 0) continue;

    issues.push({
      moduleId: module.id,
      workspaceId: module.workspaceId,
      code: "live_handler_activation_blocked",
      severity: "blocker",
      message: "Live handler registry entries must pass implementation and runtime gates before activation.",
    });
  }

  return issues;
}
