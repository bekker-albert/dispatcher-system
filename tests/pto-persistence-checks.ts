import assert from "node:assert/strict";
import * as persistenceBuckets from "../lib/domain/pto/persistence-buckets";
import * as persistenceDates from "../lib/domain/pto/persistence-dates";
import * as persistenceDiff from "../lib/domain/pto/persistence-diff";
import * as persistenceKeys from "../lib/domain/pto/persistence-keys";
import * as persistenceRows from "../lib/domain/pto/persistence-rows";
import {
  asFiniteNumber,
  asNumberRecord,
  asObjectRecord,
  asStringArray,
  latestPtoUpdatedAt,
  ptoBucketCellKeysToPairs,
  ptoBucketRowsFromRecords,
  ptoBucketRowRecordKey,
  ptoBucketRowToRecord,
  ptoBucketRowsToRecords,
  ptoBucketValueRecordKey,
  ptoBucketValueToRecord,
  ptoBucketValuesFromRecords,
  ptoBucketValuesToRecords,
  ptoBucketCellKey,
  ptoDayValueRecordInYear,
  ptoDayValueRecordKey,
  ptoDayValueRecordsForYear,
  ptoDayValuePatchesToRecords,
  ptoDayValuePatchToRecord,
  ptoDayValueRecordDates,
  ptoManualYearsKey,
  ptoMissingBucketRowRecords,
  ptoMissingBucketValueRecords,
  ptoMissingDayValueRecords,
  ptoMissingRowRecords,
  ptoPersistenceLoadIsEmpty,
  ptoPersistenceRowRecordKey,
  ptoPersistenceStateToRecords,
  ptoPlanRowIds,
  ptoRowKey,
  ptoRowsByTable,
  ptoRowsToDayRecords,
  ptoRowsToRecords,
  ptoStateFromPersistenceRecords,
  ptoUiStateKey,
  ptoYearDateRange,
  scopePtoStateForYear,
  splitPtoBucketCellKey,
} from "../lib/domain/pto/persistence-shared";
import * as persistenceState from "../lib/domain/pto/persistence-state";
import * as persistenceValues from "../lib/domain/pto/persistence-values";
import {
  createPtoDatabaseSaveBaseline,
  ptoDatabaseSaveShouldSkip,
  ptoDatabaseStateChanged,
  readPtoDatabaseSaveBaseline,
} from "../features/pto/ptoPersistenceModel";

assert.equal(persistenceValues.asFiniteNumber, asFiniteNumber);
assert.equal(persistenceKeys.ptoRowKey, ptoRowKey);
assert.equal(persistenceDiff.ptoMissingRowRecords, ptoMissingRowRecords);
assert.equal(persistenceDates.ptoYearDateRange, ptoYearDateRange);
assert.equal(persistenceRows.ptoRowsToRecords, ptoRowsToRecords);
assert.equal(persistenceBuckets.ptoBucketRowsToRecords, ptoBucketRowsToRecords);
assert.equal(persistenceState.ptoPersistenceStateToRecords, ptoPersistenceStateToRecords);
assert.equal(persistenceState.scopePtoStateForYear, scopePtoStateForYear);

const ptoRow = {
  id: "row-1",
  area: "Аксу",
  location: "",
  structure: "Перевозка",
  customerCode: "AAM",
  unit: "м3",
  status: "В работе",
  carryover: 3,
  carryovers: { "2025": 2 },
  carryoverManualYears: ["2025"],
  dailyPlans: {
    "2026-04-01": 10,
    "2026-04-02": 15.25,
    bad: 20,
  },
  years: ["2026"],
};

assert.equal(ptoRowKey("plan", "row-1"), "plan:row-1");
assert.equal(ptoBucketCellKey("row", "equipment"), "row::equipment");
assert.deepEqual(ptoPlanRowIds([ptoRow, { ...ptoRow, id: "" }]), ["row-1"]);
assert.equal(ptoPersistenceRowRecordKey({ table_type: "plan", row_id: "row-1" }), "plan:row-1");
assert.equal(ptoDayValueRecordKey({ table_type: "plan", row_id: "row-1", work_date: "2026-04-01T00:00:00.000Z" }, (value) => value.slice(0, 10)), "plan:row-1:2026-04-01");
assert.equal(ptoBucketRowRecordKey({ row_key: "aksu:work" }), "aksu:work");
assert.equal(ptoBucketValueRecordKey({ row_key: "aksu:work", equipment_key: "excavator" }), "aksu:work::excavator");
assert.deepEqual(splitPtoBucketCellKey(ptoBucketCellKey("row", "equipment")), {
  rowKey: "row",
  equipmentKey: "equipment",
});
assert.deepEqual(splitPtoBucketCellKey(ptoBucketCellKey(ptoRowKey("plan", "row-1"), "equipment")), {
  rowKey: "plan:row-1",
  equipmentKey: "equipment",
});
assert.deepEqual(splitPtoBucketCellKey("row::equipment"), { rowKey: "row", equipmentKey: "equipment" });
assert.equal(splitPtoBucketCellKey("bad"), null);

assert.deepEqual(asStringArray(["a", 1, "b"]), ["a", "b"]);
assert.deepEqual(asNumberRecord({ a: "1.5", b: "bad", c: 2 }), { a: 1.5, c: 2 });
assert.deepEqual(asObjectRecord({ a: 1 }), { a: 1 });
assert.deepEqual(asObjectRecord(["a"]), {});
assert.equal(asFiniteNumber("12.5"), 12.5);
assert.equal(asFiniteNumber("bad", 7), 7);

assert.deepEqual(ptoRowsToRecords("plan", [ptoRow]), [{
  table_type: "plan",
  row_id: "row-1",
  area: "Аксу",
  location: "",
  structure: "Перевозка",
  customer_code: "AAM",
  unit: "м3",
  status: "В работе",
  carryover: 3,
  carryovers: { "2025": 2 },
  carryover_manual_years: ["2025"],
  years: ["2026"],
  sort_index: 0,
}]);
const emptyPtoRow = {
  ...ptoRow,
  id: "row-empty",
  area: "",
  location: "",
  structure: "",
  customerCode: undefined,
  unit: "",
  status: "",
  carryover: undefined,
  carryovers: undefined,
  carryoverManualYears: undefined,
  dailyPlans: {},
  years: undefined,
} as unknown as typeof ptoRow;
assert.deepEqual(ptoRowsToRecords("plan", [emptyPtoRow]), [{
  table_type: "plan",
  row_id: "row-empty",
  area: "",
  location: "",
  structure: "",
  customer_code: "",
  unit: "",
  status: "",
  carryover: 0,
  carryovers: {},
  carryover_manual_years: [],
  years: [],
  sort_index: 0,
}]);
assert.deepEqual(ptoRowsToDayRecords("plan", [ptoRow]), [
  { table_type: "plan", row_id: "row-1", work_date: "2026-04-01", value: 10 },
  { table_type: "plan", row_id: "row-1", work_date: "2026-04-02", value: 15.25 },
]);
assert.deepEqual(ptoDayValuePatchToRecord("plan", { rowId: "row-1", day: "2026-04-03", value: 4 }), {
  table_type: "plan",
  row_id: "row-1",
  work_date: "2026-04-03",
  value: 4,
});
assert.equal(ptoDayValuePatchToRecord("plan", { rowId: "row-1", day: "2026-04-03", value: null }), null);
assert.deepEqual(
  ptoDayValuePatchesToRecords("oper", [
    { rowId: "row-1", day: "2026-04-01", value: 1 },
    { rowId: "row-1", day: "2026-04-02", value: null },
  ]),
  {
    upsertRecords: [{ table_type: "oper", row_id: "row-1", work_date: "2026-04-01", value: 1 }],
    deleteValues: [{ rowId: "row-1", day: "2026-04-02", value: null }],
  },
);
assert.deepEqual(ptoDayValueRecordDates([ptoRow]), [{ rowId: "row-1", dates: ["2026-04-01", "2026-04-02"] }]);
const stateRecords = ptoPersistenceStateToRecords({
  manualYears: ["2026"],
  planRows: [ptoRow],
  operRows: [{ ...ptoRow, id: "oper-1" }],
  surveyRows: [],
  bucketRows: [{ key: "aksu:work", area: "Аксу", structure: "Перевозка", source: "manual" }],
  bucketValues: { "aksu:work::excavator": 3 },
});
assert.equal(stateRecords.planRows.length, 1);
assert.equal(stateRecords.operRows.length, 1);
assert.equal(stateRecords.surveyRows.length, 0);
assert.equal(stateRecords.rowRecords.length, 2);
assert.equal(stateRecords.dayRecords.length, 4);
assert.equal(stateRecords.bucketRowRecords.length, 1);
assert.equal(stateRecords.bucketValueRecords.length, 1);
const scopedPtoState = scopePtoStateForYear({
  manualYears: ["2025", "2026"],
  planRows: [
    {
      ...ptoRow,
      id: "row-2026",
      dailyPlans: { "2025-12-31": 7, "2026-04-01": 10, "2027-01-01": 9 },
      years: ["2025", "2026"],
      carryovers: { "2025": 2, "2026": 3 },
      carryoverManualYears: ["2025", "2026"],
    },
    { ...ptoRow, id: "row-2025", dailyPlans: { "2025-04-01": 8 }, years: ["2025"] },
  ],
  operRows: [{ ...ptoRow, id: "oper-2026", dailyPlans: { "2026-04-01": 4 } }],
  surveyRows: [],
  bucketRows: [{ key: "aksu:work", area: "Аксу", structure: "Перевозка", source: "manual" }],
  bucketValues: { "aksu:work::excavator": 3 },
  uiState: { ptoPlanYear: "2026" },
}, "2026");
assert.deepEqual(scopedPtoState.manualYears, ["2025", "2026"]);
assert.deepEqual(scopedPtoState.planRows.map((row) => row.id), ["row-2026"]);
assert.deepEqual(scopedPtoState.planRows[0]?.dailyPlans, { "2026-04-01": 10 });
assert.deepEqual(scopedPtoState.planRows[0]?.years, ["2026"]);
assert.deepEqual(scopedPtoState.planRows[0]?.carryovers, { "2026": 3 });
assert.deepEqual(scopedPtoState.planRows[0]?.carryoverManualYears, ["2026"]);
assert.deepEqual(scopedPtoState.operRows.map((row) => row.id), ["oper-2026"]);
assert.deepEqual(scopedPtoState.bucketRows, []);
assert.deepEqual(scopedPtoState.bucketValues, {});
assert.deepEqual(
  ptoPersistenceStateToRecords({
    manualYears: [],
    planRows: [],
    operRows: [],
    surveyRows: [],
    bucketRows: [{ key: "manual:row", area: "Aksu", structure: "Manual", source: "manual" }],
    bucketValues: {
      "auto:row::excavator": 4,
      "manual:row::excavator": 2,
    },
  }).bucketValueRecords,
  [
    { row_key: "auto:row", equipment_key: "excavator", value: 4 },
    { row_key: "manual:row", equipment_key: "excavator", value: 2 },
  ],
);
assert.deepEqual(
  ptoMissingRowRecords(
    [
      ...ptoRowsToRecords("plan", [ptoRow]),
      ...ptoRowsToRecords("plan", [{ ...ptoRow, id: "stale-row" }]),
      ...ptoRowsToRecords("oper", [{ ...ptoRow, id: "stale-oper" }]),
    ],
    ptoRowsToRecords("plan", [ptoRow]),
  ).map((record) => ptoPersistenceRowRecordKey(record)),
  ["plan:stale-row", "oper:stale-oper"],
);
assert.deepEqual(
  ptoMissingDayValueRecords(
    [
      { table_type: "plan", row_id: "row-1", work_date: "2026-04-01T00:00:00.000Z", value: 10 },
      { table_type: "plan", row_id: "row-1", work_date: "2026-04-02T00:00:00.000Z", value: 15 },
      { table_type: "plan", row_id: "stale-row", work_date: "2026-04-01T00:00:00.000Z", value: 5 },
    ],
    [{ table_type: "plan", row_id: "row-1", work_date: "2026-04-01", value: 10 }],
    (value) => value.slice(0, 10),
  ).map((record) => ptoDayValueRecordKey(record, (value) => value.slice(0, 10))),
  ["plan:row-1:2026-04-02", "plan:stale-row:2026-04-01"],
);
assert.deepEqual(
  ptoMissingBucketRowRecords(
    [
      { row_key: "manual:keep", area: "Area", structure: "Keep", source: "manual", sort_index: 0 },
      { row_key: "manual:stale", area: "Area", structure: "Stale", source: "manual", sort_index: 1 },
    ],
    [{ row_key: "manual:keep", area: "Area", structure: "Keep", source: "manual", sort_index: 0 }],
  ).map(ptoBucketRowRecordKey),
  ["manual:stale"],
);
assert.deepEqual(
  ptoMissingBucketValueRecords(
    [
      { row_key: "auto:row", equipment_key: "excavator", value: 4 },
      { row_key: "manual:row", equipment_key: "loader", value: 2 },
    ],
    [{ row_key: "auto:row", equipment_key: "excavator", value: 4 }],
  ).map(ptoBucketValueRecordKey),
  ["manual:row::loader"],
);
assert.deepEqual(
  ptoRowsByTable(
    ptoRowsToRecords("plan", [ptoRow]),
    [{ table_type: "plan", row_id: "row-1", work_date: "2026-04-01T00:00:00.000Z", value: "10" }],
    "plan",
    { normalizeDate: (value) => value.slice(0, 10) },
  )[0]?.dailyPlans,
  { "2026-04-01": 10 },
);
assert.deepEqual(
  ptoRowsByTable(
    [{
      ...ptoRowsToRecords("plan", [ptoRow])[0],
      customer_code: null,
      carryovers: JSON.stringify({ "2025": "2" }),
      carryover_manual_years: JSON.stringify(["2025"]),
      years: JSON.stringify(["2026"]),
    }],
    ptoRowsToDayRecords("plan", [ptoRow]),
    "plan",
    { parseStoredValue: (value) => typeof value === "string" ? JSON.parse(value) as unknown : value },
  )[0],
  {
    ...ptoRow,
    customerCode: "",
    dailyPlans: {
      "2026-04-01": 10,
      "2026-04-02": 15.25,
    },
  },
);
assert.deepEqual(ptoBucketRowsToRecords([{ key: "aksu:work", area: "Аксу", structure: "Перевозка", source: "auto" }]), [{
  row_key: "aksu:work",
  area: "Аксу",
  structure: "Перевозка",
  source: "auto",
  sort_index: 0,
}]);
assert.deepEqual(ptoBucketRowsFromRecords([{
  row_key: "aksu:work",
  area: "Аксу",
  structure: "Перевозка",
  source: "auto",
  sort_index: 0,
}]), [{ key: "aksu:work", area: "Аксу", structure: "Перевозка", source: "auto" }]);
assert.deepEqual(ptoBucketValuesToRecords({ "aksu:work::excavator": 3.5, bad: 2 }), [{
  row_key: "aksu:work",
  equipment_key: "excavator",
  value: 3.5,
}]);
assert.deepEqual(ptoBucketValuesFromRecords([{ row_key: "aksu:work", equipment_key: "excavator", value: "3.5" }]), {
  "aksu:work::excavator": 3.5,
});
assert.deepEqual(ptoBucketRowToRecord({ key: "row", area: "Area", structure: "Work" }, 4), {
  row_key: "row",
  area: "Area",
  structure: "Work",
  source: "manual",
  sort_index: 4,
});
assert.deepEqual(ptoBucketRowsFromRecords([
  { row_key: "manual:third", area: "Area", structure: "Third", source: "manual", sort_index: 3 },
  { row_key: "manual:first", area: "Area", structure: "First", source: "manual", sort_index: 1 },
  { row_key: "manual:second", area: "Area", structure: "Second", source: "manual", sort_index: 2 },
]).map((row) => row.key), ["manual:first", "manual:second", "manual:third"]);
assert.deepEqual(ptoBucketValueToRecord("plan:row-1::equipment", 9), {
  row_key: "plan:row-1",
  equipment_key: "equipment",
  value: 9,
});
assert.equal(ptoBucketValueToRecord("plan:row-1::equipment", null), null);
assert.equal(ptoBucketValueToRecord("bad", 9), null);
assert.deepEqual(ptoBucketCellKeysToPairs(["plan:row-1::equipment", "bad", "row::eq"]), [
  { rowKey: "plan:row-1", equipmentKey: "equipment" },
  { rowKey: "row", equipmentKey: "eq" },
]);
assert.deepEqual(ptoYearDateRange("2026"), { start: "2026-01-01", end: "2026-12-31" });
assert.equal(ptoDayValueRecordInYear({ work_date: "2026-01-01" }, "2026"), true);
assert.equal(ptoDayValueRecordInYear({ work_date: "2026-12-31T00:00:00.000Z" }, "2026", (value) => value.slice(0, 10)), true);
assert.equal(ptoDayValueRecordInYear({ work_date: "2025-12-31" }, "2026"), false);
assert.equal(ptoDayValueRecordInYear({ work_date: "2027-01-01" }, "2026"), false);
assert.equal(ptoDayValueRecordInYear({ work_date: "2026-04" }, "2026"), false);
assert.deepEqual(
  ptoDayValueRecordsForYear(
    [
      { work_date: "2025-12-31", value: 1 },
      { work_date: "2026-01-01T00:00:00.000Z", value: 2 },
      { work_date: "2026-12-31T00:00:00.000Z", value: 3 },
      { work_date: "2027-01-01", value: 4 },
    ],
    "2026",
    (value) => value.slice(0, 10),
  ).map((record) => record.value),
  [2, 3],
);
assert.equal(ptoPersistenceLoadIsEmpty({
  rowRecords: [],
  dayValueRecords: [],
  settingRecords: [],
  bucketRowRecords: [],
  bucketValueRecords: [],
}), true);
assert.equal(ptoPersistenceLoadIsEmpty({
  rowRecords: ptoRowsToRecords("plan", [ptoRow]),
  dayValueRecords: [],
  settingRecords: [],
  bucketRowRecords: [],
  bucketValueRecords: [],
}), false);
const mysqlLikeState = ptoStateFromPersistenceRecords({
  rowRecords: ptoRowsToRecords("plan", [ptoRow]),
  dayValueRecords: [{ table_type: "plan", row_id: "row-1", work_date: "2026-04-01T00:00:00.000Z", value: "10", updated_at: "2026-04-02T00:00:00.000Z" }],
  settingRecords: [
    { setting_key: ptoManualYearsKey, value: JSON.stringify(["2026"]), updated_at: "2026-04-01T00:00:00.000Z" },
    { setting_key: ptoUiStateKey, value: JSON.stringify({ ptoTab: "plan" }), updated_at: "2026-04-03T00:00:00.000Z" },
  ],
  bucketRowRecords: [],
  bucketValueRecords: [],
  getSettingKey: (setting) => setting.setting_key,
  getSettingValue: (setting) => JSON.parse(setting.value) as unknown,
  normalizeDate: (value) => value.slice(0, 10),
  parseStoredValue: (value) => typeof value === "string" ? JSON.parse(value) as unknown : value,
});
const supabaseLikeState = ptoStateFromPersistenceRecords({
  rowRecords: ptoRowsToRecords("plan", [ptoRow]),
  dayValueRecords: [{ table_type: "plan", row_id: "row-1", work_date: "2026-04-01", value: 10, updated_at: "2026-04-02T00:00:00.000Z" }],
  settingRecords: [
    { key: ptoManualYearsKey, value: ["2026"], updated_at: "2026-04-01T00:00:00.000Z" },
    { key: ptoUiStateKey, value: { ptoTab: "plan" }, updated_at: "2026-04-03T00:00:00.000Z" },
  ],
  bucketRowRecords: [],
  bucketValueRecords: [],
  getSettingKey: (setting) => setting.key,
  getSettingValue: (setting) => setting.value,
});
assert.deepEqual(mysqlLikeState?.manualYears, supabaseLikeState?.manualYears);
assert.deepEqual(mysqlLikeState?.uiState, supabaseLikeState?.uiState);
assert.deepEqual(mysqlLikeState?.planRows[0]?.dailyPlans, supabaseLikeState?.planRows[0]?.dailyPlans);
assert.equal(ptoStateFromPersistenceRecords({
  rowRecords: [],
  dayValueRecords: [],
  settingRecords: [],
  bucketRowRecords: [],
  bucketValueRecords: [],
  getSettingKey: () => "",
  getSettingValue: () => null,
}), null);
assert.equal(latestPtoUpdatedAt([[{ updated_at: "2026-04-01T00:00:00.000Z" }], [{ updated_at: "2026-04-02T00:00:00.000Z" }]]), "2026-04-02T00:00:00.000Z");
assert.equal(latestPtoUpdatedAt([[{ updated_at: null }], [{ updated_at: undefined }, { updated_at: "2026-04-03T00:00:00.000Z" }]]), "2026-04-03T00:00:00.000Z");

const ptoSnapshot = JSON.stringify({ manualYears: ["2026"] });
const ptoBaseline = createPtoDatabaseSaveBaseline(ptoSnapshot, "2026-04-04T00:00:00.000Z");
assert.deepEqual(readPtoDatabaseSaveBaseline(ptoBaseline), {
  kind: "pto-database-save-baseline",
  snapshot: ptoSnapshot,
  expectedUpdatedAt: "2026-04-04T00:00:00.000Z",
});
assert.equal(readPtoDatabaseSaveBaseline(ptoSnapshot).snapshot, ptoSnapshot);
assert.equal(ptoDatabaseSaveShouldSkip("auto", ptoSnapshot, ptoBaseline), true);
assert.equal(ptoDatabaseSaveShouldSkip("manual", ptoSnapshot, ptoBaseline), true);
assert.equal(ptoDatabaseStateChanged({ manualYears: ["2026"] } as never, ptoBaseline), false);
