import assert from "node:assert/strict";
import {
  createModuleHandlerRuntimeContract,
  getRuntimeRequirementsForPlanEntry,
} from "../lib/domain/data-access/moduleHandlerRuntimeContracts";
import {
  getModuleHandlerImplementationPlanEntry,
  listModuleHandlerImplementationPlan,
} from "../lib/domain/data-access/moduleHandlerImplementationPlan";

const waybillList = createModuleHandlerRuntimeContract("taxation", "list-waybills");
assert.equal(waybillList.readyToConnectHandler, true);
assert.deepEqual(waybillList.issues, []);
assert.ok(waybillList.requirements.includes("single_database_router_dispatch"));
assert.ok(waybillList.requirements.includes("authorization_before_handler"));
assert.ok(waybillList.requirements.includes("server_query_policy_assertion"));
assert.ok(waybillList.requirements.includes("public_read_model_response_envelope"));
assert.ok(waybillList.requirements.includes("list_result_page_limit"));
assert.equal(waybillList.requirements.includes("atomic_write_transaction"), false);

const waybillDetail = createModuleHandlerRuntimeContract("taxation", "get-waybill");
assert.equal(waybillDetail.readyToConnectHandler, true);
assert.ok(waybillDetail.requirements.includes("detail_single_row_limit"));
assert.ok(waybillDetail.requirements.includes("detail_returns_version_for_edit"));
assert.ok(waybillDetail.requirements.includes("public_read_model_response_envelope"));
assert.equal(waybillDetail.requirements.includes("list_result_page_limit"), false);

const waybillExport = createModuleHandlerRuntimeContract("taxation", "export-waybills");
assert.equal(waybillExport.readyToConnectHandler, true);
assert.ok(waybillExport.requirements.includes("server_query_policy_assertion"));
assert.equal(waybillExport.requirements.includes("public_read_model_response_envelope"), false);
assert.ok(waybillExport.requirements.includes("queued_export_request"));
assert.ok(waybillExport.requirements.includes("no_inline_file_content"));

const shiftImport = createModuleHandlerRuntimeContract("dispatch", "stage-shift-report-import");
assert.equal(shiftImport.readyToConnectHandler, true);
assert.ok(shiftImport.requirements.includes("same_origin_write_guard"));
assert.ok(shiftImport.requirements.includes("stored_import_file_reference"));
assert.ok(shiftImport.requirements.includes("staged_import_validation"));
assert.ok(shiftImport.requirements.includes("validation_summary_only"));
assert.equal(shiftImport.requirements.includes("atomic_write_transaction"), false);

const waybillCreate = createModuleHandlerRuntimeContract("taxation", "create-waybill");
assert.equal(waybillCreate.readyToConnectHandler, true);
assert.ok(waybillCreate.requirements.includes("same_origin_write_guard"));
assert.ok(waybillCreate.requirements.includes("atomic_write_transaction"));
assert.ok(waybillCreate.requirements.includes("expected_version_check"));
assert.ok(waybillCreate.requirements.includes("change_history_write"));
assert.ok(waybillCreate.requirements.includes("post_commit_side_effects_only"));
assert.ok(waybillCreate.requirements.includes("compact_write_response"));
assert.equal(waybillList.requirements.includes("compact_write_response"), false);
assert.equal(shiftImport.requirements.includes("compact_write_response"), false);

const aiContext = createModuleHandlerRuntimeContract("ai-assistant", "load-ai-context");
assert.equal(aiContext.readyToConnectHandler, true);
assert.ok(aiContext.requirements.includes("authorization_before_handler"));
assert.ok(aiContext.requirements.includes("server_query_policy_assertion"));
assert.equal(aiContext.requirements.includes("public_read_model_response_envelope"), false);
assert.equal(aiContext.requirements.includes("list_result_page_limit"), false);

const unknown = createModuleHandlerRuntimeContract("taxation", "unknown-action");
assert.equal(unknown.readyToConnectHandler, false);
assert.deepEqual(unknown.requirements, []);
assert.deepEqual(unknown.issues, ["missing_implementation_gate"]);

const waybillListEntry = getModuleHandlerImplementationPlanEntry("taxation", "list-waybills");
assert.ok(waybillListEntry);
assert.deepEqual(
  getRuntimeRequirementsForPlanEntry(waybillListEntry),
  waybillList.requirements,
);

const allRuntimeContracts = listModuleHandlerImplementationPlan()
  .map((entry) => createModuleHandlerRuntimeContract(entry.resource, entry.databaseAction));
assert.ok(allRuntimeContracts.length > 0);
assert.ok(allRuntimeContracts.every((contract) => contract.readyToConnectHandler));
assert.ok(allRuntimeContracts.every((contract) => (
  contract.requirements.includes("single_database_router_dispatch")
  && contract.requirements.includes("authorization_before_handler")
)));

console.log("Module handler runtime contracts checks passed");
