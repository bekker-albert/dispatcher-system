import assert from "node:assert/strict";
import {
  createLiveModuleExportExecutionContext,
  createLiveModuleImportBatchExecutionContext,
  createLiveModuleImportValidationExecutionContext,
} from "../lib/server/database/module-file-execution";
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
    action: "export-waybills",
    payload: {},
    request,
    json,
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    ...input,
  };
}

const exportContext = createLiveModuleExportExecutionContext(createContext({
  payload: {
    format: "xlsx",
    grain: "day",
    requestedBy: "dispatcher-1",
    query: {
      pageSize: 50,
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        shift: "day",
        status: "accepted",
      },
    },
  },
}));
assert.equal(exportContext.moduleId, "taxation-waybills");
assert.equal(exportContext.generationMode, "queued");
assert.equal(exportContext.exportEnvelope.generationMode, "queued");
assert.equal(exportContext.exportEnvelope.storesFileByReference, true);
assert.equal(exportContext.exportEnvelope.avoidsClientSideRecalculation, true);
assert.equal(exportContext.exportEnvelope.rowLimit, 5000);
assert.equal(exportContext.storesFileByReference, true);
assert.equal(exportContext.forbidsInlineFileContent, true);

assert.throws(() => createLiveModuleExportExecutionContext(createContext({
  payload: {
    format: "xlsx",
    grain: "day",
    requestedBy: "dispatcher-1",
    data: [{ id: "client-row" }],
    query: {
      filters: {
        date: "2026-05-09",
        section_id: "baktai",
        shift: "day",
        status: "accepted",
      },
    },
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleExportExecutionContext(createContext({
  payload: {
    format: "xlsx",
    grain: "day",
    requestedBy: "dispatcher-1",
    query: { filters: { section_id: "baktai", status: "accepted" } },
  },
})), isDatabasePayloadError);

const importContext = createLiveModuleImportBatchExecutionContext(createContext({
  moduleId: "taxation-fuel-periods",
  action: "stage-fuel-statement-import",
  payload: {
    requestedBy: "taxation-1",
    sourceFileId: "file-1",
    originalFileName: "fuel.xlsx",
    worksheetName: "Sheet1",
    format: "xlsx",
    mode: "stage",
    declaredRowCount: 120,
    previewRowCount: 25,
  },
}));
assert.equal(importContext.moduleId, "taxation-fuel-periods");
assert.equal(importContext.importEnvelope.storesFileByReference, true);
assert.equal(importContext.importEnvelope.noInlinePayload, true);
assert.equal(importContext.importEnvelope.stagedValidationRequired, true);
assert.equal(importContext.importEnvelope.maxRows, 2000);
assert.equal(importContext.importEnvelope.previewRowLimit, 50);
assert.equal(importContext.requiresStagedValidation, true);
assert.equal(importContext.forbidsWholeTableReplacement, true);

assert.throws(() => createLiveModuleImportBatchExecutionContext(createContext({
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

const validationContext = createLiveModuleImportValidationExecutionContext(createContext({
  moduleId: "taxation-fuel-periods",
  action: "stage-fuel-statement-import",
  payload: {
    requestedBy: "taxation-1",
    batchId: "batch-1",
    sourceFileId: "file-1",
    summary: {
      totalRows: 120,
      validRows: 118,
      invalidRows: 2,
      warningRows: 1,
    },
    totalIssueCount: 2,
    issues: [{
      rowNumber: 10,
      field: "vehicle",
      code: "vehicle_missing",
      message: "Vehicle is required.",
      severity: "error",
    }],
  },
}));
assert.equal(validationContext.moduleId, "taxation-fuel-periods");
assert.equal(validationContext.validationEnvelope.resultMode, "summary-with-limited-issues");
assert.equal(validationContext.validationEnvelope.returnedIssueCount, 1);
assert.equal(validationContext.validationEnvelope.hasMoreIssues, true);
assert.equal(validationContext.returnsValidationSummaryOnly, true);
assert.equal(validationContext.issuePageSize, 50);
assert.equal(validationContext.noInlinePayload, true);

assert.throws(() => createLiveModuleImportValidationExecutionContext(createContext({
  moduleId: "taxation-fuel-periods",
  action: "stage-fuel-statement-import",
  payload: {
    requestedBy: "taxation-1",
    batchId: "batch-1",
    sourceFileId: "file-1",
    summary: {
      totalRows: 3,
      validRows: 1,
      invalidRows: 1,
      warningRows: 0,
    },
    issues: [{
      rowNumber: 5,
      code: "row_out_of_range",
      message: "Bad row number.",
      severity: "error",
    }],
  },
})), isDatabasePayloadError);

assert.throws(() => createLiveModuleImportBatchExecutionContext(createContext({
  moduleId: "taxation-waybills",
  action: "export-waybills",
  payload: {},
})), isDatabasePayloadError);

console.log("Module file execution checks passed");
