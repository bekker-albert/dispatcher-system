import assert from "node:assert/strict";
import {
  clearPtoCarryoverForYear,
  updatePtoCarryoverForYear,
  updatePtoDayValue,
  updatePtoMonthValues,
} from "../lib/domain/pto/date-row-edits";
import { normalizePtoPlanRow } from "../lib/domain/pto/date-table";
import {
  createPtoDatabaseSaveBaseline,
  patchPtoDatabaseSaveBaseline,
  readPtoDatabaseSaveBaseline,
} from "../features/pto/ptoPersistenceModel";

const ptoRow = normalizePtoPlanRow({
  id: "row-1",
  area: "Аксу",
  structure: "Перевозка",
  unit: "м3",
  dailyPlans: {
    "2026-04-01": 10,
    "2026-04-02": 15.25,
  },
  years: ["2026"],
});

const ptoInlineBaseline = createPtoDatabaseSaveBaseline(JSON.stringify({
  manualYears: ["2026"],
  planRows: [ptoRow],
  operRows: [],
  surveyRows: [],
  bucketRows: [],
  bucketValues: { "aksu:work::excavator": 3 },
  uiState: {},
}), "2026-04-04T00:00:00.000Z");

const patchedDayBaseline = readPtoDatabaseSaveBaseline(patchPtoDatabaseSaveBaseline(
  ptoInlineBaseline,
  "2026-04-05T00:00:00.000Z",
  { kind: "day-values", table: "plan", values: [{ rowId: "row-1", day: "2026-04-02", value: 22 }] },
));
const patchedDayState = JSON.parse(patchedDayBaseline.snapshot);
assert.equal(patchedDayBaseline.expectedUpdatedAt, "2026-04-05T00:00:00.000Z");
assert.equal(patchedDayState.planRows[0].dailyPlans["2026-04-02"], 22);
assert.equal(patchedDayState.bucketValues["aksu:work::excavator"], 3);

const clearedDayBaseline = readPtoDatabaseSaveBaseline(patchPtoDatabaseSaveBaseline(
  ptoInlineBaseline,
  "2026-04-05T00:00:00.000Z",
  { kind: "day-values", table: "plan", values: [{ rowId: "row-1", day: "2026-04-02", value: null }] },
));
const clearedDayState = JSON.parse(clearedDayBaseline.snapshot);
assert.equal("2026-04-02" in clearedDayState.planRows[0].dailyPlans, false);

const patchedBucketBaseline = readPtoDatabaseSaveBaseline(patchPtoDatabaseSaveBaseline(
  ptoInlineBaseline,
  "2026-04-06T00:00:00.000Z",
  { kind: "bucket-values", values: [{ cellKey: "aksu:work::excavator", value: null }] },
));
const patchedBucketState = JSON.parse(patchedBucketBaseline.snapshot);
assert.equal(patchedBucketBaseline.expectedUpdatedAt, "2026-04-06T00:00:00.000Z");
assert.equal("aksu:work::excavator" in patchedBucketState.bucketValues, false);

const manualBucketRow = {
  key: "aksu:manual",
  area: "Аксу",
  structure: "Ручная работа",
  source: "manual" as const,
};
const patchedBucketRowBaseline = readPtoDatabaseSaveBaseline(patchPtoDatabaseSaveBaseline(
  ptoInlineBaseline,
  "2026-04-07T00:00:00.000Z",
  { kind: "bucket-row", action: "upsert", row: manualBucketRow, index: 0 },
));
const patchedBucketRowState = JSON.parse(patchedBucketRowBaseline.snapshot);
assert.equal(patchedBucketRowBaseline.expectedUpdatedAt, "2026-04-07T00:00:00.000Z");
assert.deepEqual(patchedBucketRowState.bucketRows[0], manualBucketRow);

const bucketRowBaseline = createPtoDatabaseSaveBaseline(JSON.stringify({
  manualYears: ["2026"],
  planRows: [ptoRow],
  operRows: [],
  surveyRows: [],
  bucketRows: [manualBucketRow],
  bucketValues: { "aksu:manual::excavator": 5, "aksu:work::excavator": 3 },
  uiState: {},
}), "2026-04-07T00:00:00.000Z");
const deletedBucketRowBaseline = readPtoDatabaseSaveBaseline(patchPtoDatabaseSaveBaseline(
  bucketRowBaseline,
  "2026-04-08T00:00:00.000Z",
  { kind: "bucket-row", action: "delete", rowKey: manualBucketRow.key },
));
const deletedBucketRowState = JSON.parse(deletedBucketRowBaseline.snapshot);
assert.equal(deletedBucketRowState.bucketRows.length, 0);
assert.equal("aksu:manual::excavator" in deletedBucketRowState.bucketValues, false);
assert.equal(deletedBucketRowState.bucketValues["aksu:work::excavator"], 3);

const rowWithCarryover = updatePtoCarryoverForYear(ptoRow, "2026", 12.5);
assert.equal(rowWithCarryover.carryovers?.["2026"], 12.5);
assert.equal(rowWithCarryover.carryoverManualYears?.includes("2026"), true);

const rowWithoutCarryover = clearPtoCarryoverForYear(rowWithCarryover, "2026");
assert.equal(rowWithoutCarryover.carryover, 0);
assert.equal(rowWithoutCarryover.carryovers?.["2026"], undefined);

const rowWithNewDay = updatePtoDayValue(ptoRow, "2026-04-03", 7);
assert.equal(rowWithNewDay.dailyPlans["2026-04-03"], 7);
assert.equal(rowWithNewDay.years?.includes("2026"), true);

const rowWithMonthValues = updatePtoMonthValues(ptoRow, ["2026-04-01", "2026-04-02"], { "2026-04-02": 5 });
assert.equal(rowWithMonthValues.dailyPlans["2026-04-01"], undefined);
assert.equal(rowWithMonthValues.dailyPlans["2026-04-02"], 5);
