import assert from "node:assert/strict";
import {
  createGuardedLiveModuleCreateHandler,
  createGuardedLiveModuleExportHandler,
  createGuardedLiveModuleImportBatchHandler,
  createGuardedLiveModuleListHandler,
  createGuardedLiveModulePatchHandler,
  getGuardedLiveModuleHandlerFactoryKind,
  guardedLiveModuleHandlerFactoryNames,
} from "../lib/server/database/module-handler-factories";
import type { LiveModuleDatabaseHandlerContext } from "../lib/server/database/module-live-handlers";
import { isDatabasePayloadError } from "../lib/server/database/validation";

const request = new Request("https://aam-dispatch.kz/api/database", {
  method: "POST",
  headers: { origin: "https://aam-dispatch.kz" },
});
const json = (data: unknown, status = 200) => Response.json(data, { status });

function createContext(
  input: Partial<LiveModuleDatabaseHandlerContext>,
): LiveModuleDatabaseHandlerContext {
  return {
    resource: "taxation",
    action: "list-waybills",
    payload: {},
    request,
    json,
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    ...input,
  };
}

assert.deepEqual(guardedLiveModuleHandlerFactoryNames, [
  "list",
  "detail",
  "create",
  "patch",
  "export",
  "import-batch",
  "import-validation",
]);

let listHandlerCalled = false;
const listHandler = createGuardedLiveModuleListHandler(({ execution, context }) => {
  listHandlerCalled = true;
  const publicResponse = execution.createPublicResponse({
    rows: [{ id: "waybill-1", status: "created" }],
    pageSize: execution.query.pageSize,
    totalCount: 1,
  });
  if (!publicResponse.ok) return context.json(publicResponse.rejection, 500);

  return context.json(publicResponse.response);
});
assert.equal(getGuardedLiveModuleHandlerFactoryKind(listHandler), "list");
const listResponse = await listHandler(createContext({
  payload: {
    query: {
      pageSize: 25,
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        status: "created",
      },
    },
  },
}));
assert.equal(listHandlerCalled, true);
assert.deepEqual(await listResponse?.json(), {
  moduleId: "taxation-waybills",
  responseKind: "list",
  executionMode: "server-only",
  pageSize: 25,
  rows: [{ id: "waybill-1", status: "created" }],
  totalCount: 1,
  noClientFullScan: true,
});

let invalidListHandlerCalled = false;
await assert.rejects(async () => createGuardedLiveModuleListHandler(() => {
  invalidListHandlerCalled = true;
  return undefined;
})(createContext({
  payload: { query: { filters: { section_id: "baktai" } } },
})), isDatabasePayloadError);
assert.equal(invalidListHandlerCalled, false);

const createHandler = createGuardedLiveModuleCreateHandler(({ execution, context }) => {
  const insertPlan = execution.createEntityInsertSqlPlan({
    generatedEntityId: "waybill-1",
    columnValues: {
      work_date: "2026-05-09",
      section_id: "baktai",
      shift: "day",
      driver_id: "driver-1",
      vehicle_id: "vehicle-1",
    },
    createdAt: "2026-05-09T12:00:00.000Z",
    createdBy: "dispatcher-1",
  });
  const duplicateCheckSqlPlans = execution.createDuplicateCheckSqlPlans();
  const duplicateDecision = execution.evaluateDuplicateCheckResults(
    duplicateCheckSqlPlans.map((plan) => ({
      duplicateKeyColumns: plan.duplicateKeyColumns,
      rowCount: 0,
    })),
  );

  return context.json({
    action: execution.action,
    initialVersion: execution.createEnvelope.initialVersion,
    duplicateCheckRequired: execution.createEnvelope.duplicateCheckRequired,
    insertTable: insertPlan.tableSql,
    duplicateCheckCount: duplicateCheckSqlPlans.length,
    canInsert: duplicateDecision.canInsert,
  });
});
const createResponse = await createHandler(createContext({
  action: "create-waybill",
  payload: {
    data: {
      workDate: "2026-05-09",
      sectionId: "baktai",
      shift: "day",
      driverId: "driver-1",
      vehicleId: "vehicle-1",
    },
  },
}));
assert.deepEqual(await createResponse?.json(), {
  action: "create-waybill",
  initialVersion: 1,
  duplicateCheckRequired: true,
  insertTable: "`taxation_waybills`",
  duplicateCheckCount: 2,
  canInsert: true,
});

const patchHandler = createGuardedLiveModulePatchHandler(({ execution, context }) => context.json({
  action: execution.action,
  expectedVersion: execution.patchEnvelope.expectedVersion,
  patchOnly: execution.patchEnvelope.patchOnly,
  whereSql: execution.createPatchWhereSqlPlan().whereSql,
  setSql: execution.createPatchSetSqlPlan({
    columnValues: { driver_id: "driver-2" },
    updatedAt: "2026-05-09T12:00:00.000Z",
    updatedBy: "dispatcher-1",
  }).setSql,
  patchResult: execution.evaluatePatchResult({ affectedRows: 1 }).code,
}));
const patchResponse = await patchHandler(createContext({
  action: "patch-waybill",
  payload: {
    scope: { sectionId: "baktai" },
    patch: {
      entityType: "waybill",
      entity: { id: "waybill-1", version: 2 },
      changes: [{
        field: "driverId",
        previousValue: "driver-1",
        nextValue: "driver-2",
      }],
    },
  },
}));
assert.deepEqual(await patchResponse?.json(), {
  action: "patch-waybill",
  expectedVersion: 2,
  patchOnly: true,
  whereSql: "WHERE `id` = ? AND `version` = ? AND `section_id` = ?",
  setSql: "SET `driver_id` = ?, `version` = ?, `updated_at` = ?, `updated_by` = ?",
  patchResult: "patch_row_updated",
});

const exportHandler = createGuardedLiveModuleExportHandler(({ execution, context }) => context.json({
  generationMode: execution.generationMode,
  rowLimit: execution.exportEnvelope.rowLimit,
  storesFileByReference: execution.storesFileByReference,
}));
const exportResponse = await exportHandler(createContext({
  action: "export-waybills",
  payload: {
    format: "xlsx",
    grain: "day",
    requestedBy: "dispatcher-1",
    query: {
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        shift: "day",
        status: "accepted",
      },
    },
  },
}));
assert.deepEqual(await exportResponse?.json(), {
  generationMode: "queued",
  rowLimit: 5000,
  storesFileByReference: true,
});

let importHandlerCalled = false;
await assert.rejects(async () => createGuardedLiveModuleImportBatchHandler(() => {
  importHandlerCalled = true;
  return undefined;
})(createContext({
  moduleId: "taxation-fuel-periods",
  action: "stage-fuel-statement-import",
  payload: {
    requestedBy: "taxation-1",
    sourceFileId: "file-1",
    format: "xlsx",
    mode: "stage",
    declaredRowCount: 120,
    rows: [{ id: "inline-row" }],
  },
})), isDatabasePayloadError);
assert.equal(importHandlerCalled, false);

console.log("Module handler factories checks passed");
