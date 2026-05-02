import assert from "node:assert/strict";
import { normalizePtoPlanRow } from "../lib/domain/pto/date-table";
import { createPtoDateImportRowUpdates, createPtoPlanRowsFromImportTable } from "../lib/domain/pto/excel";

const duplicateCustomerRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Заказчик", "Вид работ", "Ед.", "01.04.2026", "02.04.2026", "Остатки 2025"],
  ["Аксу", "AAE", "Подача руды", "тн", "10", "", "3"],
  ["Аксу", "AAE", "Подача руды", "тн", "", "20", "5"],
], "2026", [], "plan");

assert.equal(duplicateCustomerRows.length, 1);
assert.equal(duplicateCustomerRows[0].customerCode, "AAE");
assert.equal(duplicateCustomerRows[0].dailyPlans["2026-04-01"], 10);
assert.equal(duplicateCustomerRows[0].dailyPlans["2026-04-02"], 20);
assert.equal(duplicateCustomerRows[0].carryovers?.["2026"], 5);

const duplicateLinkedRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Вид работ", "Ед.", "01.04.2026", "02.04.2026"],
  ["Аксу", "Подача руды", "тн", "7", ""],
  ["Аксу", "Подача руды", "тн", "", "9"],
], "2026", [], "oper");

assert.equal(duplicateLinkedRows.length, 1);
assert.equal(duplicateLinkedRows[0].dailyPlans["2026-04-01"], 7);
assert.equal(duplicateLinkedRows[0].dailyPlans["2026-04-02"], 9);

const existingPlanRow = normalizePtoPlanRow({
  id: "existing-plan-row",
  area: "Уч_Аксу",
  customerCode: "AAM",
  structure: "Подача руды",
  unit: "тн",
  dailyPlans: {
    "2026-04-01": 10,
    "2026-04-02": 20,
    "2026-05-01": 30,
  },
  years: ["2026"],
});
const partialImportRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Заказчик", "Вид работ", "Ед.", "02.04.2026"],
  ["Аксу", "AAM", "Подача руды", "тн", "25"],
], "2026", [existingPlanRow], "plan");

assert.equal(partialImportRows.length, 1);
assert.equal(partialImportRows[0].id, existingPlanRow.id);
assert.equal(partialImportRows[0].dailyPlans["2026-04-01"], 10);
assert.equal(partialImportRows[0].dailyPlans["2026-04-02"], 25);
assert.equal(partialImportRows[0].dailyPlans["2026-05-01"], 30);

const multiYearExistingRow = normalizePtoPlanRow({
  id: "multi-year-row",
  area: "Уч_Аксу",
  customerCode: "AAM",
  structure: "Подача руды",
  unit: "тн",
  dailyPlans: {
    "2025-04-01": 100,
    "2026-04-01": 10,
    "2026-04-02": 20,
    "2027-04-01": 300,
  },
  years: ["2025", "2026", "2027"],
});

Object.freeze(multiYearExistingRow.dailyPlans);

const monthTotalImportRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Заказчик", "Вид работ", "Ед.", "Итого 04.2026"],
  ["Аксу", "AAM", "Подача руды", "тн", "62"],
], "2026", [multiYearExistingRow], "plan");

assert.equal(monthTotalImportRows.length, 1);
assert.equal(monthTotalImportRows[0].id, multiYearExistingRow.id);
assert.equal(monthTotalImportRows[0].dailyPlans["2025-04-01"], 100);
assert.equal(monthTotalImportRows[0].dailyPlans["2027-04-01"], 300);
const importedAprilTotal = Object.entries(monthTotalImportRows[0].dailyPlans)
  .filter(([date]) => date.startsWith("2026-04"))
  .reduce((sum, [, value]) => sum + value, 0);

assert.equal(Math.round(importedAprilTotal * 1000000) / 1000000, 62);
assert.equal(Math.round((monthTotalImportRows[0].dailyPlans["2026-04-01"] ?? 0) * 100), 207);
assert.equal(Math.round((monthTotalImportRows[0].dailyPlans["2026-04-30"] ?? 0) * 100), 207);
assert.equal(multiYearExistingRow.dailyPlans["2026-04-01"], 10);

const operImportRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Вид работ", "Ед.", "01.05.2026"],
  ["Аксу", "Временная работа", "м3", "15"],
], "2026", [], "oper");
const operImportUpdates = createPtoDateImportRowUpdates("oper", operImportRows, "2026");

assert.equal(operImportUpdates.firstImportedMonth, "2026-05");
assert.equal(operImportUpdates.updateOperRows([]).length, 1);
assert.equal(operImportUpdates.updatePlanRows([]).length, 1);
assert.equal(operImportUpdates.updateSurveyRows([]).length, 1);
