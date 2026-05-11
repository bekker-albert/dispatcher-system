import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWorkspaceGuardrailReport,
  getWorkspaceModuleGuardrailIssues,
} from "../lib/domain/workspaces/guardrails";
import { validateWorkspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalogRegistry";
import {
  createWorkspaceQueuedOperationEnvelope,
  evaluateWorkspaceQueuedOperationPlan,
} from "../lib/domain/workspaces/queuedOperations";
import { getWorkspaceRegistryGuardrailIssues } from "../lib/domain/workspaces/workspaceRegistryGuardrails";
import type { WorkspaceModuleCatalogItem } from "../lib/domain/workspaces/moduleCatalog";
import { dispatchServiceWorkspaces, type DispatchWorkspaceId } from "../lib/domain/workspaces/workspaces";

const testDir = dirname(fileURLToPath(import.meta.url));
const workspaceGuardrailsSource = readFileSync(resolve(testDir, "../lib/domain/workspaces/guardrails.ts"), "utf8");
const moduleDataAccessGuardrailsSource = readFileSync(
  resolve(testDir, "../lib/domain/workspaces/moduleDataAccessGuardrails.ts"),
  "utf8",
);
const moduleReadModelGuardrailsSource = readFileSync(
  resolve(testDir, "../lib/domain/workspaces/moduleReadModelGuardrails.ts"),
  "utf8",
);
const moduleDataRouteGuardrailsSource = readFileSync(
  resolve(testDir, "../lib/domain/workspaces/moduleDataRouteGuardrails.ts"),
  "utf8",
);
const moduleListQueryGuardrailsSource = readFileSync(
  resolve(testDir, "../lib/domain/workspaces/moduleListQueryGuardrails.ts"),
  "utf8",
);
const moduleWriteModelGuardrailsSource = readFileSync(
  resolve(testDir, "../lib/domain/workspaces/moduleWriteModelGuardrails.ts"),
  "utf8",
);

assert.doesNotMatch(workspaceGuardrailsSource, /\.\.\/data-access/);
assert.match(workspaceGuardrailsSource, /getWorkspaceModuleDataAccessGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getModuleReadModelGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getModuleDataRouteGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getModuleListQueryGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getModuleWriteModelGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getImportGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getWritePipelineGuardrailIssues/);
assert.match(moduleDataAccessGuardrailsSource, /getReportAggregateGuardrailIssues/);
assert.match(workspaceGuardrailsSource, /getWorkflowTransitionRegistryGuardrailIssues/);
assert.match(moduleReadModelGuardrailsSource, /getWorkspaceModulesWithoutIndexContract/);
assert.match(moduleReadModelGuardrailsSource, /getModuleReadModelTableMismatchIssues/);
assert.match(moduleDataRouteGuardrailsSource, /getModuleDataRouteContract/);
assert.match(moduleListQueryGuardrailsSource, /getListQueryPlansWithoutRouteAction/);
assert.match(moduleWriteModelGuardrailsSource, /getCreateMutationGuardrailIssues/);

const globalReport = createWorkspaceGuardrailReport();
assert.equal(globalReport.blockerCount, 0);
assert.equal(globalReport.warningCount, 0);
assert.equal(globalReport.isReadyForImplementation, true);
assert.ok(globalReport.checkedModuleCount >= 13);
assert.equal(globalReport.issues.some((issue) => issue.code === "database_authorization_gap"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "data_route_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "data_route_strategy_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "duplicate_database_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "handler_implementation_not_ready"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "handler_phase_without_read_model"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "handler_runtime_contract_blocked"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "handler_runtime_contract_missing"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "handler_runtime_contract_missing_base_requirement"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "live_handler_activation_blocked"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_required_workspace"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "workspace_missing_performance_rule"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "access_policy_section_scope_without_filter"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_index_contract"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "index_contract_missing_required_filter"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "index_migration_definition_issue"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "duplicate_index_migration_name"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "read_model_table_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_list_query_plan"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "list_query_plan_without_route_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "list_query_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "list_query_plan_missing_required_filter"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "list_query_plan_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_patch_mutation_plan"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "patch_mutation_plan_without_route_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "patch_mutation_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "patch_mutation_plan_without_version_history"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "patch_mutation_plan_missing_section_scope"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "patch_mutation_plan_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "aggregate_invalidation_without_write_pipeline"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "write_pipeline_without_guard"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "write_pipeline_without_transaction"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_invalidation_action_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_invalidation_grain_not_allowed"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_invalidation_mutation_plan_missing"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_invalidation_source_plan_missing"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_invalidation_without_guards"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_refresh_source_filter_not_mapped"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_refresh_source_missing_list_query"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_refresh_source_without_bounded_limits"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_refresh_source_without_invalidation"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "report_aggregate_refresh_source_workspace_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_workflow_transition_binding"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "workflow_transition_workspace_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "workflow_transition_unknown_module"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "workflow_transition_unknown_workflow"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "workflow_transition_workflow_workspace_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_create_mutation_plan"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_without_route_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_without_version_history"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_without_duplicate_keys"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_missing_section_scope"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "create_mutation_plan_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_export_plan"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "export_plan_without_route_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "export_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "export_plan_without_bounded_query"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "export_plan_without_queued_request"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "export_plan_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_outside_single_router"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_without_access_policy"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_without_bounded_limits"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_without_staged_validation"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "import_plan_unsafe_identifier"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "missing_detail_query_plan"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_without_route_action"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_route_metadata_mismatch"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_without_id"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_missing_version"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_missing_section_scope"), false);
assert.equal(globalReport.issues.some((issue) => issue.code === "detail_query_plan_unsafe_identifier"), false);
assert.deepEqual(validateWorkspaceModuleCatalog(), []);

const taxationReport = createWorkspaceGuardrailReport("taxation");
assert.equal(taxationReport.checkedModuleCount, 2);
assert.equal(taxationReport.blockerCount, 0);
assert.equal(taxationReport.isReadyForImplementation, true);

const missingPoliciesModule: WorkspaceModuleCatalogItem = {
  id: "future-heavy-module",
  workspaceId: "taxation",
  title: "Future heavy module",
  status: "planned",
  tableStrategy: "server-paginated",
  editingStrategy: "workflow",
  requiredFilters: ["date", "section_id", "status"],
  nextStep: "Add policies before implementation.",
};

assert.deepEqual(getWorkspaceModuleGuardrailIssues(missingPoliciesModule).map((issue) => issue.code), [
  "missing_access_policy",
  "missing_query_policy",
  "missing_index_contract",
  "missing_persistence_contract",
  "missing_data_route_contract",
  "missing_workflow_transition_binding",
]);

const missingQueryModule: WorkspaceModuleCatalogItem = {
  id: "ai-on-demand",
  workspaceId: "ai-assistant",
  title: "AI heavy export",
  status: "planned",
  tableStrategy: "server-paginated",
  editingStrategy: "readonly",
  requiredFilters: ["date"],
  nextStep: "Should require a query policy when it becomes server-backed.",
};

assert.deepEqual(getWorkspaceModuleGuardrailIssues(missingQueryModule).map((issue) => issue.code), [
  "missing_query_policy",
  "missing_index_contract",
  "missing_list_query_plan",
]);

const catalogBaseModule: WorkspaceModuleCatalogItem = {
  id: "catalog-test-module",
  workspaceId: "taxation",
  title: "Catalog test module",
  status: "planned",
  contractSource: "lib/domain/taxation/service-contracts.ts",
  tableStrategy: "server-paginated",
  editingStrategy: "workflow",
  requiredFilters: ["date"],
  nextStep: "Keep catalog rules testable.",
};

assert.deepEqual(validateWorkspaceModuleCatalog([
  catalogBaseModule,
  { ...catalogBaseModule, workspaceId: "missing-workspace" as DispatchWorkspaceId },
  { ...catalogBaseModule, id: "catalog-heavy-without-filters", requiredFilters: [] },
  { ...catalogBaseModule, id: "catalog-none-with-filters", tableStrategy: "none" },
  { ...catalogBaseModule, id: "catalog-existing-without-source", status: "existing", currentSource: undefined },
  { ...catalogBaseModule, id: "catalog-scaffold-without-source", status: "scaffold", currentSource: undefined },
  { ...catalogBaseModule, id: "catalog-planned-without-contract", contractSource: undefined },
  { ...catalogBaseModule, id: "catalog-empty-next-step", nextStep: "" },
], ["taxation"]).map((issue) => issue.code), [
  "duplicate_module_id",
  "module_unknown_workspace",
  "heavy_module_without_filters",
  "none_strategy_with_filters",
  "existing_module_without_current_source",
  "scaffold_module_without_current_source",
  "planned_module_without_contract_source",
  "module_missing_next_step",
]);

assert.deepEqual(validateWorkspaceModuleCatalog([
  catalogBaseModule,
], ["taxation", "fleet"]).map((issue) => issue.code), [
  "workspace_without_catalog_modules",
]);

const missingFleetCatalogReport = createWorkspaceGuardrailReport("fleet", [catalogBaseModule]);
assert.deepEqual(missingFleetCatalogReport.issues.map((issue) => issue.code), [
  "workspace_without_catalog_modules",
]);
assert.equal(missingFleetCatalogReport.isReadyForImplementation, false);

assert.deepEqual(getWorkspaceRegistryGuardrailIssues(
  "taxation",
  dispatchServiceWorkspaces.filter((workspace) => workspace.id !== "taxation"),
).map((issue) => issue.code), [
  "missing_required_workspace",
]);

const queuedExport = createWorkspaceQueuedOperationEnvelope({
  id: "report-export-1",
  kind: "export",
  trigger: "manual-request",
  workspaceId: "reports",
  moduleId: "prepared-reports",
  requestedBy: "dispatcher-1",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-15",
  sectionId: "baktay",
  maxInputRows: 5000,
  estimatedInputRows: 1250,
  maxRuntimeSeconds: 120,
  storesResultByReference: true,
});
assert.equal(queuedExport.ok, true);
if (queuedExport.ok) {
  assert.equal(queuedExport.envelope.executionMode, "queued");
  assert.equal(queuedExport.envelope.noResidentProcess, true);
  assert.equal(queuedExport.envelope.storesResultByReference, true);
  assert.equal(queuedExport.envelope.maxRuntimeSeconds, 120);
}

assert.deepEqual(evaluateWorkspaceQueuedOperationPlan({
  id: "bad-background-job",
  kind: "gps-reconciliation",
  trigger: "continuous-background",
  workspaceId: "smts-gps",
  moduleId: "smts-fuel-drains",
  readsAllWorkspaces: true,
  usesFullHistory: true,
  periodStart: "2026-05-31",
  periodEnd: "2026-05-01",
  storesResultByReference: false,
}).issues.map((issue) => issue.code), [
  "continuous_background_forbidden",
  "requester_required",
  "full_history_forbidden",
  "all_workspace_scan_forbidden",
  "period_invalid",
  "input_limit_required",
  "runtime_limit_required",
  "inline_result_forbidden",
]);

console.log("Workspace guardrails checks passed");
