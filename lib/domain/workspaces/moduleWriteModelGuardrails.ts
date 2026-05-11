import {
  getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies,
  getDetailQueryPlansMissingVersionForVersionedContracts,
  getDetailQueryPlansWithRouteMetadataMismatch,
  getDetailQueryPlansWithoutId,
  getDetailQueryPlansWithoutRouteAction,
  getMissingDetailQueryPlans,
  getUnsafeDetailQueryPlanIdentifiers,
} from "../data-access/moduleDetailQueryPlans";
import {
  getMissingPatchMutationPlans,
  getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies,
  getPatchMutationPlansWithRouteMetadataMismatch,
  getPatchMutationPlansWithoutRouteAction,
  getPatchMutationPlansWithoutVersionHistory,
  getUnsafePatchMutationPlanIdentifiers,
} from "../data-access/modulePatchMutationPlans";
import { getModulePersistenceContract, type ModulePersistenceContract } from "../data-access/persistenceContracts";
import { getCreateMutationGuardrailIssues } from "./createMutationGuardrails";
import { getExportGuardrailIssues } from "./exportGuardrails";
import type { WorkspaceGuardrailIssue } from "./guardrailTypes";
import { addModuleGuardrailIssue } from "./moduleGuardrailIssueFactory";
import type { WorkspaceModuleCatalogItem } from "./moduleCatalog";

const patchWriteModes: Array<ModulePersistenceContract["writeMode"]> = ["versioned-patch", "workflow-patch"];

export function getModulePersistencePresenceGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  if (getModulePersistenceContract(module.id)) return [];

  return [{
    moduleId: module.id,
    workspaceId: module.workspaceId,
    code: "missing_persistence_contract",
    severity: "blocker",
    message: "Module must declare persistence entities and write mode.",
  }];
}

export function getModuleWriteModelGuardrailIssues(
  module: WorkspaceModuleCatalogItem,
): WorkspaceGuardrailIssue[] {
  const persistenceContract = getModulePersistenceContract(module.id);
  if (!persistenceContract) return [];

  const issues: WorkspaceGuardrailIssue[] = [];
  const missingPatchMutationPlans = getMissingPatchMutationPlans(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const patchMutationRouteGaps = getPatchMutationPlansWithoutRouteAction(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const patchMutationMetadataGaps = getPatchMutationPlansWithRouteMetadataMismatch()
    .filter((issue) => issue.moduleId === module.id);
  const patchMutationVersionHistoryGaps = getPatchMutationPlansWithoutVersionHistory(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const patchMutationSectionScopeGaps = getPatchMutationPlansMissingSectionScopeForSectionScopedPolicies(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const unsafePatchMutationIdentifiers = getUnsafePatchMutationPlanIdentifiers(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const missingDetailQueryPlans = getMissingDetailQueryPlans(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const detailQueryRouteGaps = getDetailQueryPlansWithoutRouteAction(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const detailQueryMetadataGaps = getDetailQueryPlansWithRouteMetadataMismatch()
    .filter((issue) => issue.moduleId === module.id);
  const detailQueryIdGaps = getDetailQueryPlansWithoutId(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const detailQueryVersionGaps = getDetailQueryPlansMissingVersionForVersionedContracts(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const detailQuerySectionScopeGaps = getDetailQueryPlansMissingSectionScopeForSectionScopedPolicies(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);
  const unsafeDetailQueryIdentifiers = getUnsafeDetailQueryPlanIdentifiers(module.workspaceId)
    .filter((issue) => issue.moduleId === module.id);

  if (
    patchWriteModes.includes(persistenceContract.writeMode)
    && (!persistenceContract.versioned || !persistenceContract.patchOnly || !persistenceContract.writesChangeHistory)
  ) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_contract_without_version_history",
      "blocker",
      "Patch/workflow modules must be versioned, patch-only and auditable.",
    );
  }

  if (missingPatchMutationPlans.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "missing_patch_mutation_plan",
      "blocker",
      "Patch/workflow actions must declare table, version columns and audit mutation plan.",
    );
  }

  if (patchMutationRouteGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_mutation_plan_without_route_action",
      "blocker",
      "Patch mutation plan database action must match the module data route action.",
    );
  }

  if (patchMutationMetadataGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_mutation_plan_route_metadata_mismatch",
      "blocker",
      "Patch mutation plan workspace and resource must match the module data route contract.",
    );
  }

  if (patchMutationVersionHistoryGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_mutation_plan_without_version_history",
      "blocker",
      "Patch mutation plan must require expected version, patch-only writes and change history.",
    );
  }

  if (patchMutationSectionScopeGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_mutation_plan_missing_section_scope",
      "blocker",
      "Section-scoped patch plans must include section_id in the future SQL scope.",
    );
  }

  if (unsafePatchMutationIdentifiers.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "patch_mutation_plan_unsafe_identifier",
      "blocker",
      "Patch mutation plan must use safe table, column and history entity identifiers.",
    );
  }

  issues.push(...getCreateMutationGuardrailIssues(module));
  issues.push(...getExportGuardrailIssues(module));

  if (missingDetailQueryPlans.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "missing_detail_query_plan",
      "blocker",
      "Open/detail actions must declare a bounded single-row query plan.",
    );
  }

  if (detailQueryRouteGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_without_route_action",
      "blocker",
      "Detail query plan database action must match the module data route open action.",
    );
  }

  if (detailQueryMetadataGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_route_metadata_mismatch",
      "blocker",
      "Detail query plan workspace and resource must match the module data route contract.",
    );
  }

  if (detailQueryIdGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_without_id",
      "blocker",
      "Detail query plan must require id and return at most one row.",
    );
  }

  if (detailQueryVersionGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_missing_version",
      "blocker",
      "Versioned entities must return version from detail queries before editing.",
    );
  }

  if (detailQuerySectionScopeGaps.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_missing_section_scope",
      "blocker",
      "Section-scoped modules must apply section_id scope to detail/open queries.",
    );
  }

  if (unsafeDetailQueryIdentifiers.length > 0) {
    addModuleGuardrailIssue(
      issues,
      module,
      "detail_query_plan_unsafe_identifier",
      "blocker",
      "Detail query plan must use safe table and column identifiers.",
    );
  }

  if (module.tableStrategy === "aggregate" && !persistenceContract.aggregateOnly) {
    addModuleGuardrailIssue(
      issues,
      module,
      "aggregate_without_prepared_contract",
      "warning",
      "Aggregate modules should read prepared data instead of recalculating large datasets.",
    );
  }

  if (module.tableStrategy === "on-demand-export" && !persistenceContract.exportOnDemand) {
    addModuleGuardrailIssue(
      issues,
      module,
      "export_without_on_demand_contract",
      "warning",
      "Export modules should create export requests on demand.",
    );
  }

  return issues;
}
