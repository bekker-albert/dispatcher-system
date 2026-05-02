import assert from "node:assert/strict";
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
