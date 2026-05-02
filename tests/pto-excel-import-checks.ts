import assert from "node:assert/strict";
import { normalizePtoPlanRow } from "../lib/domain/pto/date-table";
import { createPtoPlanRowsFromImportTable } from "../lib/domain/pto/excel";

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
