import assert from "node:assert/strict";
import {
  createServerDetailQueryEnvelope,
  validateServerDetailResult,
} from "../lib/domain/data-access/detailQueryEnvelope";
import {
  createServerListQueryEnvelope,
  validateServerPageResult,
} from "../lib/domain/data-access/listQueryEnvelope";
import {
  createPublicReadModelDetailResponse,
  createPublicReadModelListResponse,
  validatePublicReadModelPayload,
} from "../lib/domain/data-access/readModelResponseEnvelope";
import { getWorkspaceModuleQueryPolicy } from "../lib/domain/data-access/workspaceQueryPolicies";

const firstReadModelModules = [
  {
    moduleId: "taxation-waybills",
    listAction: "list-waybills",
    detailAction: "get-waybill",
    listDraft: {
      pageSize: 50,
      filters: {
        date: "2026-05-08",
        section_id: "baktay",
        shift: "day",
        status: "created",
      },
      sort: { field: "date", direction: "desc" as const },
      search: "101",
    },
    detailDraft: {
      id: "waybill-101",
      scope: { section_id: "baktay", vehicle_id: "truck-101" },
      expectedVersion: 3,
    },
  },
  {
    moduleId: "mining-shift-reports",
    listAction: "list-shift-reports",
    detailAction: "get-shift-report",
    listDraft: {
      pageSize: 25,
      filters: {
        date_from: "2026-05-01",
        date_to: "2026-05-15",
        section_id: "baktay",
        shift: "night",
        status: "submitted",
      },
      sort: { field: "date", direction: "desc" as const },
      search: "EX-1200",
    },
    detailDraft: {
      id: "shift-report-1",
      scope: { section_id: "baktay" },
      expectedVersion: "7",
    },
  },
] as const;

for (const readModelModule of firstReadModelModules) {
  const queryPolicy = getWorkspaceModuleQueryPolicy(readModelModule.moduleId);
  assert.ok(queryPolicy, `${readModelModule.moduleId} must have query policy before read-model rollout.`);

  const listEnvelope = createServerListQueryEnvelope({
    moduleId: readModelModule.moduleId,
    policy: queryPolicy.policy,
    draft: readModelModule.listDraft,
    requestedBy: "stage-2-read-model-check",
  });
  assert.equal(listEnvelope.ok, true, `${readModelModule.listAction} must satisfy server query policy.`);
  if (!listEnvelope.ok) continue;

  assert.equal(listEnvelope.envelope.executionMode, "server-only");
  assert.equal(listEnvelope.envelope.moduleId, readModelModule.moduleId);
  assert.equal(listEnvelope.envelope.maxClientRows, listEnvelope.envelope.query.pageSize);
  assert.ok(listEnvelope.envelope.maxClientRows <= 100);
  assert.equal(listEnvelope.envelope.requestedBy, "stage-2-read-model-check");
  assert.deepEqual(validateServerPageResult(listEnvelope.envelope.query, {
    rows: [{ id: `${readModelModule.moduleId}-row-1` }],
    pageSize: listEnvelope.envelope.query.pageSize,
    totalCount: 1,
  }), []);
  const publicListResponse = createPublicReadModelListResponse(listEnvelope.envelope, {
    rows: [{ id: `${readModelModule.moduleId}-row-1`, status: "created" }],
    pageSize: listEnvelope.envelope.query.pageSize,
    totalCount: 1,
  });
  assert.equal(publicListResponse.ok, true);
  if (!publicListResponse.ok) continue;

  assert.equal(publicListResponse.response.responseKind, "list");
  assert.equal(publicListResponse.response.executionMode, "server-only");
  assert.equal(publicListResponse.response.moduleId, readModelModule.moduleId);
  assert.equal(publicListResponse.response.pageSize, listEnvelope.envelope.query.pageSize);
  assert.equal(publicListResponse.response.noClientFullScan, true);
  assert.equal(JSON.stringify(publicListResponse.response).includes("cacheKey"), false);
  assert.equal(JSON.stringify(publicListResponse.response).includes("query"), false);

  assert.deepEqual(validateServerPageResult(listEnvelope.envelope.query, {
    rows: Array.from({ length: listEnvelope.envelope.query.pageSize + 1 }, (_, index) => ({ id: index })),
    pageSize: listEnvelope.envelope.query.pageSize,
  }).map((issue) => issue.code), ["rows_exceed_page_size"]);
  const rejectedPublicListResponse = createPublicReadModelListResponse(listEnvelope.envelope, {
    rows: Array.from({ length: listEnvelope.envelope.query.pageSize + 1 }, (_, index) => ({ id: index })),
    pageSize: listEnvelope.envelope.query.pageSize,
  });
  assert.equal(rejectedPublicListResponse.ok, false);
  if (!rejectedPublicListResponse.ok) {
    assert.ok(rejectedPublicListResponse.rejection.issues.some((issue) => issue.code === "server_result_invalid"));
  }
  const rejectedSqlLeakListResponse = createPublicReadModelListResponse(listEnvelope.envelope, {
    rows: [{ id: `${readModelModule.moduleId}-row-1`, sql: "SELECT * FROM hidden_table" }],
    pageSize: listEnvelope.envelope.query.pageSize,
  });
  assert.equal(rejectedSqlLeakListResponse.ok, false);
  if (!rejectedSqlLeakListResponse.ok) {
    assert.ok(rejectedSqlLeakListResponse.rejection.issues.some((issue) => (
      issue.code === "internal_key_exposed" && issue.key === "sql"
    )));
  }

  const detailEnvelope = createServerDetailQueryEnvelope({
    moduleId: readModelModule.moduleId,
    draft: readModelModule.detailDraft,
  });
  assert.equal(detailEnvelope.ok, true, `${readModelModule.detailAction} must satisfy detail query envelope.`);
  if (!detailEnvelope.ok) continue;

  assert.equal(detailEnvelope.envelope.executionMode, "server-only");
  assert.equal(detailEnvelope.envelope.moduleId, readModelModule.moduleId);
  assert.equal(detailEnvelope.envelope.maxRows, 1);
  assert.equal(detailEnvelope.envelope.returnsVersion, true);
  assert.deepEqual(validateServerDetailResult(detailEnvelope.envelope, {
    row: {
      id: detailEnvelope.envelope.id,
      version: detailEnvelope.envelope.expectedVersion ?? 1,
      status: "created",
    },
    rowCount: 1,
  }), []);
  const publicDetailResponse = createPublicReadModelDetailResponse(detailEnvelope.envelope, {
    row: {
      id: detailEnvelope.envelope.id,
      version: detailEnvelope.envelope.expectedVersion ?? 1,
      status: "created",
    },
    rowCount: 1,
  });
  assert.equal(publicDetailResponse.ok, true);
  if (!publicDetailResponse.ok) continue;

  assert.equal(publicDetailResponse.response.responseKind, "detail");
  assert.equal(publicDetailResponse.response.executionMode, "server-only");
  assert.equal(publicDetailResponse.response.moduleId, readModelModule.moduleId);
  assert.equal(publicDetailResponse.response.maxRows, 1);
  assert.equal(publicDetailResponse.response.returnsVersion, true);
  assert.equal(publicDetailResponse.response.noClientFullScan, true);
  assert.equal(JSON.stringify(publicDetailResponse.response).includes("cacheKey"), false);
  assert.equal(JSON.stringify(publicDetailResponse.response).includes("scopeColumns"), false);

  const rejectedPublicDetailResponse = createPublicReadModelDetailResponse(detailEnvelope.envelope, {
    row: {
      id: detailEnvelope.envelope.id,
      status: "created",
    },
    rowCount: 1,
  });
  assert.equal(rejectedPublicDetailResponse.ok, false);
  if (!rejectedPublicDetailResponse.ok) {
    assert.ok(rejectedPublicDetailResponse.rejection.issues.some((issue) => (
      issue.code === "server_result_invalid" && issue.key === "version"
    )));
  }

  const publicEnvelopeJson = JSON.stringify({
    list: listEnvelope.envelope,
    detail: detailEnvelope.envelope,
  });
  assert.equal(publicEnvelopeJson.includes("tableName"), false);
  assert.equal(publicEnvelopeJson.includes("taxation_waybills"), false);
  assert.equal(publicEnvelopeJson.includes("mining_shift_reports"), false);
}

assert.deepEqual(validatePublicReadModelPayload({
  moduleId: "taxation-waybills",
  tableName: "taxation_waybills",
}).map((issue) => issue.code), ["internal_key_exposed"]);
assert.deepEqual(validatePublicReadModelPayload({
  rows: [{ id: "waybill-1", params: ["secret"], whereSql: "WHERE id = ?" }],
}).map((issue) => issue.key), ["params", "whereSql"]);

console.log("Stage 2 read model envelope checks passed");
