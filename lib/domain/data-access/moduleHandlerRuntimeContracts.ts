import {
  evaluateModuleHandlerImplementationGate,
  getModuleHandlerImplementationPlanEntry,
  type ModuleHandlerImplementationPlanEntry,
} from "./moduleHandlerImplementationPlan";

export type ModuleHandlerRuntimeRequirement =
  | "single_database_router_dispatch"
  | "authorization_before_handler"
  | "same_origin_write_guard"
  | "server_query_policy_assertion"
  | "list_result_page_limit"
  | "detail_single_row_limit"
  | "detail_returns_version_for_edit"
  | "public_read_model_response_envelope"
  | "queued_export_request"
  | "no_inline_file_content"
  | "stored_import_file_reference"
  | "staged_import_validation"
  | "validation_summary_only"
  | "atomic_write_transaction"
  | "expected_version_check"
  | "change_history_write"
  | "post_commit_side_effects_only"
  | "compact_write_response";

export type ModuleHandlerRuntimeContractIssueCode =
  | "missing_implementation_gate"
  | "implementation_gate_blocked";

export type ModuleHandlerRuntimeContract = {
  resource: string;
  databaseAction: string;
  readyToConnectHandler: boolean;
  requirements: ModuleHandlerRuntimeRequirement[];
  issues: ModuleHandlerRuntimeContractIssueCode[];
};

const baseRequirements: ModuleHandlerRuntimeRequirement[] = [
  "single_database_router_dispatch",
  "authorization_before_handler",
];

const readModelRequirements: ModuleHandlerRuntimeRequirement[] = [
  "server_query_policy_assertion",
];

const publicReadModelResponseRequirements: ModuleHandlerRuntimeRequirement[] = [
  "public_read_model_response_envelope",
];

const writeRequirements: ModuleHandlerRuntimeRequirement[] = [
  "same_origin_write_guard",
  "atomic_write_transaction",
  "expected_version_check",
  "change_history_write",
  "post_commit_side_effects_only",
  "compact_write_response",
];

function uniqueRequirements(requirements: ModuleHandlerRuntimeRequirement[]) {
  return Array.from(new Set(requirements));
}

export function getRuntimeRequirementsForPlanEntry(
  entry: ModuleHandlerImplementationPlanEntry,
): ModuleHandlerRuntimeRequirement[] {
  if (entry.phase === "export-queue") {
    return uniqueRequirements([
      ...baseRequirements,
      ...readModelRequirements,
      "queued_export_request",
      "no_inline_file_content",
    ]);
  }

  if (entry.phase === "import-staging") {
    return uniqueRequirements([
      ...baseRequirements,
      "same_origin_write_guard",
      "stored_import_file_reference",
      "staged_import_validation",
      "validation_summary_only",
    ]);
  }

  if (entry.phase === "write-workflow") {
    return uniqueRequirements([
      ...baseRequirements,
      ...writeRequirements,
    ]);
  }

  return uniqueRequirements([
    ...baseRequirements,
    ...readModelRequirements,
    ...(
      entry.contractKind === "list" || entry.contractKind === "detail"
        ? publicReadModelResponseRequirements
        : []
    ),
    ...(entry.contractKind === "list" ? ["list_result_page_limit" as const] : []),
    ...(entry.contractKind === "detail" ? [
      "detail_single_row_limit" as const,
      "detail_returns_version_for_edit" as const,
    ] : []),
  ]);
}

export function createModuleHandlerRuntimeContract(
  resource: string,
  databaseAction: string,
): ModuleHandlerRuntimeContract {
  const entry = getModuleHandlerImplementationPlanEntry(resource, databaseAction);
  if (!entry) {
    return {
      resource,
      databaseAction,
      readyToConnectHandler: false,
      requirements: [],
      issues: ["missing_implementation_gate"],
    };
  }

  const gate = evaluateModuleHandlerImplementationGate(resource, databaseAction);
  return {
    resource,
    databaseAction,
    readyToConnectHandler: gate.readyToConnectHandler,
    requirements: getRuntimeRequirementsForPlanEntry(entry),
    issues: gate.readyToConnectHandler ? [] : ["implementation_gate_blocked"],
  };
}
