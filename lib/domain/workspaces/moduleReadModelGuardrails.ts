import { getDuplicateModuleDatabaseIndexNames, getModuleDatabaseIndexDefinitionIssues } from "../data-access/indexMigrationPlan";
import { getModuleReadModelTableMismatchIssues } from "../data-access/moduleReadModelSchemaReadiness";
import {
  getIndexContractsMissingRequiredFilters,
  getWorkspaceModulesWithoutIndexContract,
} from "../data-access/indexContracts";
import { getWorkspaceModuleQueryPolicy, getWorkspaceModulesRequiringQueryPolicy } from "../data-access/workspaceQueryPolicies";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import { addModuleGuardrailIssue } from "./moduleGuardrailIssueFactory";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

function shouldModuleHaveQueryPolicy(module: WorkspaceModuleCatalogItem) {
  return getWorkspaceModulesRequiringQueryPolicy([module]).length > 0;
}

export function getModuleReadModelGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const issues: WorkspaceGuardrailIssue[] = [];
  const queryPolicy = getWorkspaceModuleQueryPolicy(module.id);
  const missingIndexContract = getWorkspaceModulesWithoutIndexContract([module]).length > 0;
  const missingIndexFilters = getIndexContractsMissingRequiredFilters([module]);
  const indexDefinitionIssues = getModuleDatabaseIndexDefinitionIssues()
    .filter((issue) => issue.moduleId === module.id);
  const readModelTableMismatches = getModuleReadModelTableMismatchIssues(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const duplicateIndexNames = indexDefinitionIssues.length > 0
    ? []
    : getDuplicateModuleDatabaseIndexNames()
        .filter((collision) => collision.statements.some((statement) => statement.moduleId === module.id));

  if (shouldModuleHaveQueryPolicy(module) && !queryPolicy) {
    addModuleGuardrailIssue(issues, module, "missing_query_policy", "blocker", "Server-backed modules must have a bounded query policy.");
  }

  if (missingIndexContract) {
    addModuleGuardrailIssue(
      issues,
      module,
      "missing_index_contract",
      "blocker",
      "Server-backed modules must declare database indexes for bounded filters.",
    );
  } else if (missingIndexFilters.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "index_contract_missing_required_filter",
      "blocker",
      "Database index contract must cover every required server filter.",
    );
  }

  if (indexDefinitionIssues.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "index_migration_definition_issue",
      "blocker",
      "Index migration plan must contain only safe identifiers and non-empty field lists.",
    );
  }

  if (duplicateIndexNames.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "duplicate_index_migration_name",
      "blocker",
      "Index migration plan must not contain duplicate table/index names.",
    );
  }

  if (readModelTableMismatches.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "read_model_table_mismatch",
      "blocker",
      "List and detail read-model plans for the same module must use the same source table.",
    );
  }

  return issues;
}
