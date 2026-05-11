import {
  getDuplicateModuleDataRouteActions,
  getModuleDataRouteContract,
  validateModuleDataRouteIdentifiers,
  validateModuleDataRouteStrategyAlignment,
} from "../data-access/moduleDataRoutes";
import { getModuleDatabaseAuthorizationGaps } from "../data-access/moduleDatabaseAuthorization";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import { addModuleGuardrailIssue } from "./moduleGuardrailIssueFactory";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

export function getModuleDataRouteGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const issues: WorkspaceGuardrailIssue[] = [];
  const dataRouteContract = getModuleDataRouteContract(module.id);
  const duplicateDataRouteActions = getDuplicateModuleDataRouteActions()
    .filter((collision) => collision.bindings.some((binding) => binding.moduleId === module.id));
  const databaseAuthorizationGaps = getModuleDatabaseAuthorizationGaps()
    .filter((gap) => gap.moduleId === module.id);
  const unsafeIdentifierIssues = validateModuleDataRouteIdentifiers()
    .filter((issue) => issue.moduleId === module.id);
  const strategyAlignmentIssues = validateModuleDataRouteStrategyAlignment()
    .filter((issue) => issue.moduleId === module.id);

  if (!dataRouteContract) {
    addModuleGuardrailIssue(issues, module, "missing_data_route_contract", "blocker", "Module must declare how it uses the shared /api/database router.");
    return issues;
  }

  if (dataRouteContract.endpoint !== "/api/database" || dataRouteContract.routeKind !== "single-database-router") {
    addModuleGuardrailIssue(
      issues,
      module,
      "data_route_outside_database_router",
      "blocker",
      "Module data access must stay inside the single Next.js database router.",
    );
  }

  if (!dataRouteContract.requiresPreflight) {
    addModuleGuardrailIssue(
      issues,
      module,
      "data_route_without_preflight",
      "blocker",
      "Module data route must require access and query preflight before execution.",
    );
  }

  if (duplicateDataRouteActions.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "duplicate_database_action",
      "blocker",
      "Module database actions must be unique per shared database resource.",
    );
  }

  if (databaseAuthorizationGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "database_authorization_gap",
      "blocker",
      "Module database actions must map to access matrix capabilities for future server authorization.",
    );
  }

  if (unsafeIdentifierIssues.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "data_route_unsafe_identifier",
      "blocker",
      "Module database resource and action names must be lower-kebab identifiers inside the shared router.",
    );
  }

  if (strategyAlignmentIssues.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "data_route_strategy_mismatch",
      "blocker",
      "Module database actions must match its table and editing strategies.",
    );
  }

  return issues;
}
