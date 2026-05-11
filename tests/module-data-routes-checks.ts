import assert from "node:assert/strict";
import {
  getDuplicateModuleDataRouteActions,
  getDataRouteContractsOutsideSingleDatabaseRouter,
  getDataRouteContractsWithoutPreflight,
  getModuleDataRouteActionBinding,
  getModuleDataRouteAction,
  getModuleDataRouteContract,
  getModuleDataRouteContractByDatabaseAction,
  getWorkspaceModulesWithoutDataRouteContract,
  listModuleDataRouteActionBindings,
  listModuleDataRouteContracts,
  moduleDataRouteContracts,
  validateModuleDataRouteIdentifiers,
  validateModuleDataRouteStrategyAlignment,
} from "../lib/domain/data-access/moduleDataRoutes";
import type { WorkspaceModuleCatalogItem } from "../lib/domain/workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../lib/domain/workspaces/moduleCatalog";

assert.equal(getWorkspaceModulesWithoutDataRouteContract().length, 0);
assert.equal(moduleDataRouteContracts.length, workspaceModuleCatalog.length);
assert.equal(getDataRouteContractsOutsideSingleDatabaseRouter().length, 0);
assert.equal(getDataRouteContractsWithoutPreflight().length, 0);
assert.equal(getDuplicateModuleDataRouteActions().length, 0);
assert.deepEqual(validateModuleDataRouteIdentifiers(), []);
assert.deepEqual(validateModuleDataRouteStrategyAlignment(), []);

const taxationWaybills = getModuleDataRouteContract("taxation-waybills");
assert.ok(taxationWaybills);
assert.equal(taxationWaybills.endpoint, "/api/database");
assert.equal(taxationWaybills.routeKind, "single-database-router");
assert.equal(taxationWaybills.resource, "taxation");
assert.equal(taxationWaybills.actions.list, "list-waybills");
assert.equal(taxationWaybills.actions.edit, "patch-waybill");
assert.equal(taxationWaybills.implementationStatus, "planned");

const reports = getModuleDataRouteContract("prepared-reports");
assert.ok(reports);
assert.equal(reports.resource, "reports");
assert.equal(reports.actions.export, "create-report-export-request");

assert.equal(getModuleDataRouteAction("access-matrix", "admin"), "admin-access-grant");
assert.equal(getModuleDataRouteAction("ai-on-demand", "open"), "load-ai-context");
assert.equal(getModuleDataRouteAction("prepared-reports", "edit"), undefined);
assert.equal(getModuleDataRouteActionBinding("taxation", "list-waybills")?.moduleId, "taxation-waybills");
assert.equal(getModuleDataRouteActionBinding("taxation", "list-waybills")?.accessAction, "list");
assert.equal(getModuleDataRouteContractByDatabaseAction("taxation", "list-waybills")?.contract.moduleId, "taxation-waybills");
assert.equal(getModuleDataRouteContractByDatabaseAction("unknown", "unknown"), undefined);

assert.deepEqual(listModuleDataRouteContracts("smts-gps").map((contract) => contract.moduleId), [
  "smts-vehicle-cards",
  "smts-fuel-drains",
]);

const taxationBindings = listModuleDataRouteActionBindings("taxation");
assert.ok(taxationBindings.length >= 12);
assert.ok(taxationBindings.every((binding) => binding.workspaceId === "taxation"));
assert.ok(taxationBindings.every((binding) => binding.routeKey === `${binding.resource}:${binding.databaseAction}`));
assert.equal(taxationBindings.find((binding) => binding.databaseAction === "patch-waybill")?.accessAction, "edit");
assert.equal(new Set(taxationBindings.map((binding) => binding.routeKey)).size, taxationBindings.length);
assert.equal(getDuplicateModuleDataRouteActions("taxation").length, 0);

assert.deepEqual(validateModuleDataRouteIdentifiers([
  {
    moduleId: "unsafe-route-test",
    workspaceId: "taxation",
    endpoint: "/api/database",
    routeKind: "single-database-router",
    resource: "Taxation/API",
    actions: {
      list: "list/waybills",
      edit: "patchWaybill",
      export: "export-waybills",
    },
    requiresPreflight: true,
    implementationStatus: "planned",
    notes: "Intentional unsafe identifier fixture.",
  },
]).map((issue) => issue.code), [
  "unsafe_resource_identifier",
  "unsafe_database_action_identifier",
  "unsafe_database_action_identifier",
]);

const strategyFixtureModules: WorkspaceModuleCatalogItem[] = [
  {
    id: "readonly-route-test",
    workspaceId: "reports",
    title: "Readonly route test",
    status: "planned",
    contractSource: "lib/domain/reports/aggregation-contracts.ts",
    tableStrategy: "none",
    editingStrategy: "readonly",
    requiredFilters: [],
    nextStep: "Readonly routes must not expose write actions.",
  },
  {
    id: "table-route-test",
    workspaceId: "taxation",
    title: "Table route test",
    status: "planned",
    contractSource: "lib/domain/taxation/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "versioned-patch",
    requiredFilters: ["date"],
    nextStep: "Table routes must expose list/detail and edit.",
  },
  {
    id: "workflow-route-test",
    workspaceId: "fleet",
    title: "Workflow route test",
    status: "planned",
    contractSource: "lib/domain/fleet/service-contracts.ts",
    tableStrategy: "server-paginated",
    editingStrategy: "workflow",
    requiredFilters: ["status"],
    nextStep: "Workflow routes must expose approve transition.",
  },
];

assert.deepEqual(validateModuleDataRouteStrategyAlignment(strategyFixtureModules, [
  {
    moduleId: "readonly-route-test",
    workspaceId: "reports",
    endpoint: "/api/database",
    routeKind: "single-database-router",
    resource: "reports",
    actions: {
      open: "get-readonly-route-test",
      edit: "patch-readonly-route-test",
    },
    requiresPreflight: true,
    implementationStatus: "planned",
    notes: "Intentional readonly write fixture.",
  },
  {
    moduleId: "table-route-test",
    workspaceId: "fleet",
    endpoint: "/api/database",
    routeKind: "single-database-router",
    resource: "taxation",
    actions: {
      export: "export-table-route-test",
    },
    requiresPreflight: true,
    implementationStatus: "planned",
    notes: "Intentional table route fixture without list/detail/edit.",
  },
  {
    moduleId: "workflow-route-test",
    workspaceId: "fleet",
    endpoint: "/api/database",
    routeKind: "single-database-router",
    resource: "fleet",
    actions: {
      list: "list-workflow-route-test",
      open: "get-workflow-route-test",
      edit: "patch-workflow-route-test",
    },
    requiresPreflight: true,
    implementationStatus: "planned",
    notes: "Intentional workflow route fixture without approve.",
  },
  {
    moduleId: "missing-route-module",
    workspaceId: "admin",
    endpoint: "/api/database",
    routeKind: "single-database-router",
    resource: "admin",
    actions: {
      list: "list-missing-route-module",
    },
    requiresPreflight: true,
    implementationStatus: "planned",
    notes: "Intentional unknown module fixture.",
  },
]).map((issue) => issue.code), [
  "data_route_readonly_has_write_action",
  "data_route_workspace_mismatch",
  "data_route_missing_list_action",
  "data_route_missing_open_action",
  "data_route_versioned_patch_missing_edit_action",
  "data_route_workflow_missing_approve_action",
  "data_route_module_missing",
]);

console.log("Module data routes checks passed");
