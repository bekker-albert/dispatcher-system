import assert from "node:assert/strict";
import { normalizePtoPlanRow } from "../lib/domain/pto/date-table";
import { createPtoDateImportRowUpdates, createPtoPlanRowsFromImportTable } from "../lib/domain/pto/excel";

const AREA_HEADER = "\u0423\u0447\u0430\u0441\u0442\u043e\u043a";
const CUSTOMER_HEADER = "\u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a";
const STRUCTURE_HEADER = "\u0412\u0438\u0434 \u0440\u0430\u0431\u043e\u0442";
const UNIT_HEADER = "\u0415\u0434.";
const CARRYOVER_2025_HEADER = "\u041e\u0441\u0442\u0430\u0442\u043a\u0438 2025";
const APRIL_2026_TOTAL_HEADER = "\u0418\u0442\u043e\u0433\u043e 04.2026";

const AREA_AKSU = "\u0410\u043a\u0441\u0443";
const NORMALIZED_AREA_AKSU = "\u0423\u0447_\u0410\u043a\u0441\u0443";
const ORE_FEED_STRUCTURE = "\u041f\u043e\u0434\u0430\u0447\u0430 \u0440\u0443\u0434\u044b";
const TEMPORARY_WORK_STRUCTURE = "\u0412\u0440\u0435\u043c\u0435\u043d\u043d\u0430\u044f \u0440\u0430\u0431\u043e\u0442\u0430";
const TONNES_UNIT = "\u0442\u043d";
const CUBIC_METERS_UNIT = "\u043c3";

const duplicateCustomerRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, CUSTOMER_HEADER, STRUCTURE_HEADER, UNIT_HEADER, "01.04.2026", "02.04.2026", CARRYOVER_2025_HEADER],
  [AREA_AKSU, "AAE", ORE_FEED_STRUCTURE, TONNES_UNIT, "10", "", "3"],
  [AREA_AKSU, "AAE", ORE_FEED_STRUCTURE, TONNES_UNIT, "", "20", "5"],
], "2026", [], "plan");

assert.equal(duplicateCustomerRows.length, 1);
assert.equal(duplicateCustomerRows[0].customerCode, "AAE");
assert.equal(duplicateCustomerRows[0].dailyPlans["2026-04-01"], 10);
assert.equal(duplicateCustomerRows[0].dailyPlans["2026-04-02"], 20);
assert.equal(duplicateCustomerRows[0].carryovers?.["2026"], 5);

const duplicateLinkedRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, STRUCTURE_HEADER, UNIT_HEADER, "01.04.2026", "02.04.2026"],
  [AREA_AKSU, ORE_FEED_STRUCTURE, TONNES_UNIT, "7", ""],
  [AREA_AKSU, ORE_FEED_STRUCTURE, TONNES_UNIT, "", "9"],
], "2026", [], "oper");

assert.equal(duplicateLinkedRows.length, 1);
assert.equal(duplicateLinkedRows[0].dailyPlans["2026-04-01"], 7);
assert.equal(duplicateLinkedRows[0].dailyPlans["2026-04-02"], 9);

const existingPlanRow = normalizePtoPlanRow({
  id: "existing-plan-row",
  area: NORMALIZED_AREA_AKSU,
  customerCode: "AAM",
  structure: ORE_FEED_STRUCTURE,
  unit: TONNES_UNIT,
  dailyPlans: {
    "2026-04-01": 10,
    "2026-04-02": 20,
    "2026-05-01": 30,
  },
  years: ["2026"],
});
const partialImportRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, CUSTOMER_HEADER, STRUCTURE_HEADER, UNIT_HEADER, "02.04.2026"],
  [AREA_AKSU, "AAM", ORE_FEED_STRUCTURE, TONNES_UNIT, "25"],
], "2026", [existingPlanRow], "plan");

assert.equal(partialImportRows.length, 1);
assert.equal(partialImportRows[0].id, existingPlanRow.id);
assert.equal(partialImportRows[0].dailyPlans["2026-04-01"], 10);
assert.equal(partialImportRows[0].dailyPlans["2026-04-02"], 25);
assert.equal(partialImportRows[0].dailyPlans["2026-05-01"], 30);

const multiYearExistingRow = normalizePtoPlanRow({
  id: "multi-year-row",
  area: NORMALIZED_AREA_AKSU,
  customerCode: "AAM",
  structure: ORE_FEED_STRUCTURE,
  unit: TONNES_UNIT,
  dailyPlans: {
    "2024-04-01": 100,
    "2025-04-01": 200,
    "2026-04-01": 10,
    "2026-04-02": 20,
  },
  years: ["2024", "2025", "2026"],
});
const multiYearExistingDailyPlans = { ...multiYearExistingRow.dailyPlans };
const multiYearExistingCarryovers = { ...multiYearExistingRow.carryovers };

Object.freeze(multiYearExistingRow);
Object.freeze(multiYearExistingRow.dailyPlans);

const monthTotalImportRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, CUSTOMER_HEADER, STRUCTURE_HEADER, UNIT_HEADER, APRIL_2026_TOTAL_HEADER],
  [AREA_AKSU, "AAM", ORE_FEED_STRUCTURE, TONNES_UNIT, "62"],
], "2026", [multiYearExistingRow], "plan");

assert.equal(monthTotalImportRows.length, 1);
assert.equal(monthTotalImportRows[0].id, multiYearExistingRow.id);
assert.notStrictEqual(monthTotalImportRows[0].dailyPlans, multiYearExistingRow.dailyPlans);
assert.equal(monthTotalImportRows[0].dailyPlans["2024-04-01"], 100);
assert.equal(monthTotalImportRows[0].dailyPlans["2025-04-01"], 200);
const importedAprilTotal = Object.entries(monthTotalImportRows[0].dailyPlans)
  .filter(([date]) => date.startsWith("2026-04"))
  .reduce((sum, [, value]) => sum + value, 0);

assert.equal(Math.round(importedAprilTotal * 1000000) / 1000000, 62);
assert.equal(Math.round((monthTotalImportRows[0].dailyPlans["2026-04-01"] ?? 0) * 100), 207);
assert.equal(Math.round((monthTotalImportRows[0].dailyPlans["2026-04-30"] ?? 0) * 100), 207);
assert.equal(multiYearExistingRow.dailyPlans["2026-04-01"], 10);
assert.deepEqual(multiYearExistingRow.dailyPlans, multiYearExistingDailyPlans);
assert.deepEqual(multiYearExistingRow.carryovers, multiYearExistingCarryovers);

const dayColumnsWinWhenTheyChangeRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, CUSTOMER_HEADER, STRUCTURE_HEADER, UNIT_HEADER, APRIL_2026_TOTAL_HEADER, "02.04.2026"],
  [AREA_AKSU, "AAM", ORE_FEED_STRUCTURE, TONNES_UNIT, "90", "25"],
], "2026", [multiYearExistingRow], "plan");

assert.equal(dayColumnsWinWhenTheyChangeRows.length, 1);
assert.equal(dayColumnsWinWhenTheyChangeRows[0].dailyPlans["2024-04-01"], 100);
assert.equal(dayColumnsWinWhenTheyChangeRows[0].dailyPlans["2025-04-01"], 200);
assert.equal(dayColumnsWinWhenTheyChangeRows[0].dailyPlans["2026-04-01"], 10);
assert.equal(dayColumnsWinWhenTheyChangeRows[0].dailyPlans["2026-04-02"], 25);
assert.deepEqual(multiYearExistingRow.dailyPlans, multiYearExistingDailyPlans);

const monthTotalWinsWhenImportedDaysStillMatchRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, CUSTOMER_HEADER, STRUCTURE_HEADER, UNIT_HEADER, "01.04.2026", "02.04.2026", APRIL_2026_TOTAL_HEADER],
  [AREA_AKSU, "AAM", ORE_FEED_STRUCTURE, TONNES_UNIT, "10", "20", "62"],
], "2026", [multiYearExistingRow], "plan");
const monthTotalWinsAprilTotal = Object.entries(monthTotalWinsWhenImportedDaysStillMatchRows[0].dailyPlans)
  .filter(([date]) => date.startsWith("2026-04"))
  .reduce((sum, [, value]) => sum + value, 0);

assert.equal(Math.round(monthTotalWinsAprilTotal * 1000000) / 1000000, 62);
assert.equal(Math.round((monthTotalWinsWhenImportedDaysStillMatchRows[0].dailyPlans["2026-04-01"] ?? 0) * 100), 207);
assert.equal(monthTotalWinsWhenImportedDaysStillMatchRows[0].dailyPlans["2024-04-01"], 100);
assert.equal(monthTotalWinsWhenImportedDaysStillMatchRows[0].dailyPlans["2025-04-01"], 200);
assert.deepEqual(multiYearExistingRow.dailyPlans, multiYearExistingDailyPlans);

const operImportRows = createPtoPlanRowsFromImportTable([
  [AREA_HEADER, STRUCTURE_HEADER, UNIT_HEADER, "01.05.2026"],
  [AREA_AKSU, TEMPORARY_WORK_STRUCTURE, CUBIC_METERS_UNIT, "15"],
], "2026", [], "oper");
const operImportUpdates = createPtoDateImportRowUpdates("oper", operImportRows, "2026");

assert.equal(operImportUpdates.firstImportedMonth, "2026-05");
assert.equal(operImportUpdates.updateOperRows([]).length, 1);
assert.equal(operImportUpdates.updatePlanRows([]).length, 1);
assert.equal(operImportUpdates.updateSurveyRows([]).length, 1);
