import assert from "node:assert/strict";
import * as persistenceRows from "../lib/domain/pto/persistence-rows";
import {
  ptoRowsByTables,
  ptoRowsToRecords,
} from "../lib/domain/pto/persistence-shared";

const baseRow = {
  id: "row-1",
  area: "Aksu",
  location: "",
  structure: "Transport",
  customerCode: "AAM",
  unit: "m3",
  status: "In progress",
  carryover: 0,
  carryovers: {},
  carryoverManualYears: [],
  dailyPlans: {
    "2026-04-01": 10,
  },
  years: ["2026"],
};

assert.equal(persistenceRows.ptoRowsByTables, ptoRowsByTables);

assert.deepEqual(
  ptoRowsByTables(
    [
      ...ptoRowsToRecords("plan", [baseRow]),
      ...ptoRowsToRecords("oper", [{ ...baseRow, id: "oper-1" }]),
      ...ptoRowsToRecords("survey", [{ ...baseRow, id: "survey-1" }]),
    ],
    [
      { table_type: "plan", row_id: "row-1", work_date: "2026-04-01T00:00:00.000Z", value: "10" },
      { table_type: "oper", row_id: "oper-1", work_date: "2026-04-02T00:00:00.000Z", value: "20" },
      { table_type: "survey", row_id: "survey-1", work_date: "2026-04-03T00:00:00.000Z", value: "30" },
    ],
    { normalizeDate: (value) => value.slice(0, 10) },
  ),
  {
    planRows: [{ ...baseRow, dailyPlans: { "2026-04-01": 10 } }],
    operRows: [{ ...baseRow, id: "oper-1", dailyPlans: { "2026-04-02": 20 } }],
    surveyRows: [{ ...baseRow, id: "survey-1", dailyPlans: { "2026-04-03": 30 } }],
  },
);
