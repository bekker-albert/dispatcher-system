import assert from "node:assert/strict";
import { createPtoDateVirtualRowsViewModel } from "../features/pto/ptoDateVirtualRowsViewModel";
import { createPtoDatabaseState, localPtoCanSkipFullDatabaseLoad, localPtoNeedsDatabaseFreshnessCheck, normalizeLoadedPtoDatabaseState, resolvePtoDatabaseLoadResolution, validatePtoDatabaseLoadState } from "../features/pto/ptoPersistenceModel";
import { createEmptyPtoDateRow, dateRange, insertPtoRowAfter, normalizePtoPlanRow, ptoAreaMatches, ptoEffectiveCarryover, ptoFieldLogLabel, ptoLinkedRowMatches, ptoLinkedRowSignature, ptoRowFieldDomKey, reorderPtoRows } from "../lib/domain/pto/date-table";
import { calculatePtoVirtualRows } from "../lib/domain/pto/virtualization";
import { buildReportPtoIndex, createReportRowFromPtoPlan, deriveReportRowFromPto, deriveReportRowFromPtoIndex } from "../lib/domain/reports/calculation";
import { normalizeStoredReportCustomers } from "../lib/domain/reports/customers";
import { defaultReportCustomerId, defaultReportCustomers, defaultReportRows } from "../lib/domain/reports/defaults";
import { applyReportFactSourceRows, createReportSummaryRow, delta, formatReportTitleDate, reportAutoColumnWidth, reportCustomerEffectiveRowKeys, reportRowAutoStatus, reportRowHasAutoShowData, reportRowKey, reportRowsForCustomer } from "../lib/domain/reports/display";
import { reportYearFact } from "../lib/domain/reports/facts";
import { reportPtoIndexKey } from "../lib/domain/reports/pto-index";

const nbsp = "\u00a0";

const previousYearRow = normalizePtoPlanRow({
  id: "previous",
  area: "Уч_Аксу",
  structure: "Перевозка",
  unit: "м3",
  dailyPlans: { "2025-12-31": 40 },
  years: ["2025"],
});
const currentYearRow = normalizePtoPlanRow({
  id: "current",
  area: "Аксу",
  structure: "Перевозка",
  unit: "м3",
  dailyPlans: {},
  years: ["2026"],
});

assert.equal(ptoEffectiveCarryover(currentYearRow, "2026", [previousYearRow, currentYearRow]), 40);
assert.equal(ptoAreaMatches("Уч_Аксу", "Аксу"), true);
assert.equal(ptoLinkedRowMatches(currentYearRow, "missing", ptoLinkedRowSignature(previousYearRow)), true);
assert.deepEqual(reorderPtoRows([previousYearRow, currentYearRow], "current", "", "previous", "", "before").map((row) => row.id), ["current", "previous"]);
assert.equal(createEmptyPtoDateRow("Новая", "Аксу", "2026", "new").area, "Уч_Аксу");
assert.deepEqual(insertPtoRowAfter([previousYearRow], previousYearRow, currentYearRow).map((row) => row.id), ["previous", "current"]);
assert.equal(ptoFieldLogLabel("carryover"), "Остатки");
assert.equal(ptoRowFieldDomKey("row", "area"), "row:area");
const virtualRows = calculatePtoVirtualRows(
  Array.from({ length: 100 }, (_, index) => ({ id: String(index) })),
  { "plan:20": 80 },
  "plan",
  { top: 900, height: 320 },
);
assert.equal(virtualRows.renderedRows.length < 100, true);
assert.equal(virtualRows.topSpacerHeight > 0, true);
assert.equal(virtualRows.bottomSpacerHeight > 0, true);
assert.equal(virtualRows.rowHeights[20], 80);
const readonlyVirtualRows = createPtoDateVirtualRowsViewModel({
  rows: Array.from({ length: 100 }, (_, index) => normalizePtoPlanRow({
    id: `readonly-${index}`,
    area: "Aksu",
    structure: "Readonly virtual row",
    unit: "m3",
    dailyPlans: {},
    years: ["2026"],
  })),
  rowHeights: {},
  table: "oper",
  viewport: { top: 900, height: 320 },
});
assert.equal(readonlyVirtualRows.renderedRows.length < 100, true);
assert.equal(readonlyVirtualRows.virtualStartIndex > 0, true);

const emptyPtoDatabaseState = createPtoDatabaseState({
  manualYears: ["2026"],
  planRows: [],
  operRows: [],
  surveyRows: [],
  bucketValues: {},
  bucketRows: [],
  uiState: { expandedPtoMonths: {} },
});
const databasePtoRow = createEmptyPtoDateRow("Database", "Aksu", "2026", "database-row");
const localPtoRow = createEmptyPtoDateRow("Local", "Aksu", "2026", "local-row");
const staleDatabasePtoState = {
  ...emptyPtoDatabaseState,
  planRows: [databasePtoRow],
  updatedAt: "2026-04-24T10:00:00.000Z",
};
const newerLocalPtoState = {
  ...emptyPtoDatabaseState,
  planRows: [localPtoRow],
};

assert.doesNotThrow(() => validatePtoDatabaseLoadState(staleDatabasePtoState));
assert.throws(() => validatePtoDatabaseLoadState({ ...staleDatabasePtoState, planRows: undefined as unknown as never }));
assert.equal(resolvePtoDatabaseLoadResolution({
  databaseState: null,
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
  shouldRestoreClientSnapshot: false,
}).kind, "empty-save-local");
assert.equal(resolvePtoDatabaseLoadResolution({
  databaseState: staleDatabasePtoState,
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
  shouldRestoreClientSnapshot: false,
}).kind, "keep-local");
assert.equal(resolvePtoDatabaseLoadResolution({
  databaseState: staleDatabasePtoState,
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T09:00:00.000Z",
  shouldRestoreClientSnapshot: true,
}).kind, "restore-local");
assert.equal(resolvePtoDatabaseLoadResolution({
  databaseState: staleDatabasePtoState,
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T09:00:00.000Z",
  shouldRestoreClientSnapshot: false,
}).kind, "use-database");
const normalizedLoadedPtoState = normalizeLoadedPtoDatabaseState({
  ...staleDatabasePtoState,
  uiState: {
    ptoTab: "plan",
    expandedPtoMonths: { "2026-04": true, bad: "x" as unknown as boolean },
    ptoColumnWidths: { area: 9999, unit: 10 },
  },
}, emptyPtoDatabaseState);
assert.deepEqual(normalizedLoadedPtoState.uiState.expandedPtoMonths, { "2026-04": true });
assert.equal(normalizedLoadedPtoState.uiState.ptoColumnWidths.area, 800);
assert.equal(normalizedLoadedPtoState.uiState.ptoColumnWidths.unit, 44);

const planRow = normalizePtoPlanRow({
  id: "plan",
  area: "Уч_Аксу",
  structure: "Подача руды",
  customerCode: "AA",
  unit: "Куб",
  dailyPlans: { "2026-04-18": 100 },
  years: ["2026"],
});
const operRow = normalizePtoPlanRow({
  id: "oper",
  area: "Аксу",
  structure: "Подача руды",
  unit: "м3",
  dailyPlans: { "2026-04-18": 80 },
  years: ["2026"],
});
const reportRow = createReportRowFromPtoPlan(planRow);
const derivedReportRow = deriveReportRowFromPto(reportRow, "2026-04-18", [planRow], [], [operRow]);
const indexedDerivedReportRow = deriveReportRowFromPtoIndex(
  reportRow,
  "2026-04-18",
  buildReportPtoIndex([planRow], { includeCustomerCode: true }),
  buildReportPtoIndex([]),
  buildReportPtoIndex([operRow]),
);

assert.equal(reportRow.unit, "м3");
assert.equal(reportRow.customerCode, "AA");
assert.equal(derivedReportRow.dayPlan, 100);
assert.equal(derivedReportRow.dayFact, 80);
assert.equal(derivedReportRow.yearPlan, 100);
assert.deepEqual(indexedDerivedReportRow, derivedReportRow);
assert.equal(reportYearFact(derivedReportRow), 80);
assert.equal(delta(derivedReportRow.dayPlan, derivedReportRow.dayFact), -20);

const surveyCutoffPlanRow = normalizePtoPlanRow({
  id: "plan-survey-cutoff",
  area: "Aksu",
  structure: "Survey Cutoff",
  unit: "m3",
  dailyPlans: { "2026-04-24": 1 },
  years: ["2026"],
});
const surveyCutoffOperRow = normalizePtoPlanRow({
  id: "oper-survey-cutoff",
  area: "Aksu",
  structure: "Survey Cutoff",
  unit: "m3",
  dailyPlans: Object.fromEntries(dateRange("2026-04-01", "2026-04-24").map((date) => [date, 1])),
  years: ["2026"],
});
const surveyCutoffSurveyRow = normalizePtoPlanRow({
  id: "survey-survey-cutoff",
  area: "Aksu",
  structure: "Survey Cutoff",
  unit: "m3",
  dailyPlans: {
    "2026-04-05": 10,
    "2026-04-11": 20,
    "2026-04-15": 30,
    "2026-04-20": 40,
    "2026-04-24": 0,
  },
  years: ["2026"],
});
const surveyCutoffReportRow = createReportRowFromPtoPlan(surveyCutoffPlanRow);
const surveyCutoffDerivedRow = deriveReportRowFromPtoIndex(
  surveyCutoffReportRow,
  "2026-04-24",
  buildReportPtoIndex([surveyCutoffPlanRow]),
  buildReportPtoIndex([surveyCutoffSurveyRow]),
  buildReportPtoIndex([surveyCutoffOperRow]),
);
const noSurveyDerivedRow = deriveReportRowFromPtoIndex(
  surveyCutoffReportRow,
  "2026-04-24",
  buildReportPtoIndex([surveyCutoffPlanRow]),
  buildReportPtoIndex([]),
  buildReportPtoIndex([surveyCutoffOperRow]),
);

assert.equal(surveyCutoffDerivedRow.monthSurveyFact, 100);
assert.equal(surveyCutoffDerivedRow.monthOperFact, 4);
assert.equal(reportYearFact(surveyCutoffDerivedRow), 104);
assert.equal(noSurveyDerivedRow.monthSurveyFact, 0);
assert.equal(noSurveyDerivedRow.monthOperFact, 24);
assert.equal(reportYearFact(noSurveyDerivedRow), 24);

const compactPlanWidth = reportAutoColumnWidth("day-plan", "План суточный", ["123 456"]);
const widePlanWidth = reportAutoColumnWidth("day-plan", "План суточный", ["123 456 789"]);
const annualRemainingWidth = reportAutoColumnWidth("annual-remaining", "Остаток", ["-2 703 243"]);
const monthFactWidth = reportAutoColumnWidth("month-fact", "Маркзамер + оперучет", [`123 456${nbsp}789\nмарк 214${nbsp}596`]);
const dayProductivityWidth = reportAutoColumnWidth("day-productivity", "Произв. техники", [`16 800\n104%`]);
const monthProductivityWidth = reportAutoColumnWidth("month-productivity", "Произв. накоп.", [`481 768\n104%`]);
assert.ok(compactPlanWidth <= 78);
assert.ok(widePlanWidth > compactPlanWidth);
assert.ok(widePlanWidth <= 78);
assert.ok(annualRemainingWidth > compactPlanWidth);
assert.ok(annualRemainingWidth <= 104);
assert.ok(monthFactWidth > compactPlanWidth);
assert.ok(monthFactWidth <= 96);
assert.ok(dayProductivityWidth <= 72);
assert.ok(monthProductivityWidth <= 78);
assert.ok(monthProductivityWidth >= dayProductivityWidth);
assert.ok(reportAutoColumnWidth("unit", "Ед.", ["м3"]) <= 34);
assert.equal(defaultReportRows.length, 5);
assert.equal(defaultReportCustomerId, "aa-mining");
assert.equal(defaultReportCustomers[0].rowKeys.length, defaultReportRows.length);
assert.equal(defaultReportCustomers[0].ptoCode, "AAM");
assert.equal(formatReportTitleDate("2026-04-18"), "субботу, 18 апреля 2026 г.");
assert.equal(reportRowKey({ ...reportRow, customerCode: "" }), "аксу::подачаруды");
assert.equal(reportRowKey(reportRow), "аксу::подачаруды::aa");
assert.equal(reportPtoIndexKey(reportRow.area, reportRow.name, "AA"), reportRowKey(reportRow));
assert.equal(localPtoCanSkipFullDatabaseLoad({
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
  databaseUpdatedAt: "2026-04-24T10:00:00.000Z",
}), true);
assert.equal(localPtoCanSkipFullDatabaseLoad({
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T09:00:00.000Z",
  databaseUpdatedAt: "2026-04-24T10:00:00.000Z",
}), false);
assert.equal(localPtoCanSkipFullDatabaseLoad({
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
  databaseUpdatedAt: undefined,
}), false);
assert.equal(localPtoNeedsDatabaseFreshnessCheck({
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
}), true);
assert.equal(localPtoNeedsDatabaseFreshnessCheck({
  currentState: emptyPtoDatabaseState,
  hasStoredPtoState: true,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
}), false);
assert.equal(localPtoNeedsDatabaseFreshnessCheck({
  currentState: newerLocalPtoState,
  hasStoredPtoState: false,
  localUpdatedAt: "2026-04-24T12:00:00.000Z",
}), false);
assert.equal(localPtoNeedsDatabaseFreshnessCheck({
  currentState: newerLocalPtoState,
  hasStoredPtoState: true,
  localUpdatedAt: null,
}), false);
const aamDuplicateReportRow = { ...reportRow, customerCode: "AAM" };
const aaDuplicateReportRow = { ...reportRow, customerCode: "AA" };
const customDuplicateReportRow = { ...reportRow, customerCode: "C4" };
const aamOtherReportRow = { ...reportRow, name: "Другая работа", customerCode: "AAM" };
const reportCustomerForPtoCode = (ptoCode: string) => ({
  ...defaultReportCustomers[0],
  id: `customer-${ptoCode}`,
  ptoCode,
});
assert.deepEqual(
  reportRowsForCustomer([aamDuplicateReportRow, aaDuplicateReportRow, aamOtherReportRow], reportCustomerForPtoCode("AAM")).map(reportRowKey),
  [reportRowKey(aamDuplicateReportRow), reportRowKey(aamOtherReportRow)],
);
assert.deepEqual(
  reportRowsForCustomer([aamDuplicateReportRow, aaDuplicateReportRow, aamOtherReportRow], reportCustomerForPtoCode("AA")).map(reportRowKey),
  [reportRowKey(aaDuplicateReportRow), reportRowKey(aamOtherReportRow)],
);
assert.deepEqual(
  reportRowsForCustomer([aamDuplicateReportRow, customDuplicateReportRow, aamOtherReportRow], reportCustomerForPtoCode("C4")).map(reportRowKey),
  [reportRowKey(customDuplicateReportRow), reportRowKey(aamOtherReportRow)],
);
assert.equal(
  createReportSummaryRow({ id: "sum", area: "Аксу", label: "Итого", unit: "м3", rowKeys: [] }, [derivedReportRow])?.dayFact,
  80,
);

const factSourceTargetRow = { ...derivedReportRow, area: "Aksu", name: "Target fact row", dayFact: 5, monthFact: 5, monthSurveyFact: 0, monthOperFact: 5, yearFact: 5, yearSurveyFact: 0, yearOperFact: 5, annualFact: 5 };
const factSourceSourceRow = { ...derivedReportRow, area: "Aksu", name: "Source fact row", dayFact: 12, monthFact: 12, monthSurveyFact: 0, monthOperFact: 12, yearFact: 12, yearSurveyFact: 0, yearOperFact: 12, annualFact: 12 };
const factSourceRows = applyReportFactSourceRows(
  [factSourceTargetRow, factSourceSourceRow],
  { [reportRowKey(factSourceTargetRow)]: [reportRowKey(factSourceSourceRow)] },
);
assert.equal(factSourceRows[0].dayFact, 12);
assert.equal(reportYearFact(factSourceRows[0]), 12);
assert.equal(factSourceRows[1].dayFact, 12);

const normalizedReportCustomers = normalizeStoredReportCustomers([
  {
    id: "customer",
    label: " Заказчик ",
    visible: true,
    autoShowRows: true,
    rowKeys: ["a", "a"],
    hiddenRowKeys: ["b", "b"],
    rowLabels: { a: " Вид работ " },
    factSourceRowKeys: { a: ["b", "b"] },
    summaryRows: [{ id: "s", label: " ", unit: "м3", area: "Аксу", rowKeys: ["a", "a"] }],
    areaOrder: ["Аксу", "Аксу"],
    workOrder: { Аксу: ["a", "a"] },
  },
], [{
  id: "fallback",
  label: "Fallback",
  ptoCode: "AAM",
  visible: true,
  autoShowRows: false,
  rowKeys: [],
  hiddenRowKeys: [],
  rowLabels: {},
  factSourceRowKeys: {},
  summaryRows: [],
  areaOrder: [],
  workOrder: {},
}]);
assert.equal(normalizedReportCustomers[0].label, "Заказчик");
assert.deepEqual(normalizedReportCustomers[0].rowKeys, ["a"]);
assert.deepEqual(normalizedReportCustomers[0].factSourceRowKeys, { a: ["b"] });
assert.deepEqual(normalizedReportCustomers[0].summaryRows[0].rowKeys, ["a"]);
assert.deepEqual(normalizedReportCustomers[0].areaOrder, ["Аксу"]);
assert.deepEqual(normalizedReportCustomers[0].workOrder, { Аксу: ["a"] });
assert.deepEqual(
  Array.from(reportCustomerEffectiveRowKeys({
    id: "auto",
    label: "Auto",
    ptoCode: "AAM",
    visible: true,
    autoShowRows: true,
    rowKeys: ["manual"],
    hiddenRowKeys: ["b"],
    rowLabels: {},
    factSourceRowKeys: {},
    summaryRows: [],
    areaOrder: [],
    workOrder: {},
  }, new Set(["a", "b", "c"]))),
  ["a", "c"],
);
assert.equal(reportRowHasAutoShowData({ dayPlan: 1, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), true);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 1, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), true);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 1, monthPlan: 0, monthFact: 0 }), false);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 1, monthFact: 0 }), true);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 1 }), true);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), false);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 0, yearFact: 0, annualPlan: 20 }), false);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 10, annualPlan: 20 }), false);
assert.equal(reportRowHasAutoShowData({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 10, annualPlan: 10 }), false);
assert.equal(reportRowAutoStatus({ dayPlan: 1, dayFact: 1, monthTotalPlan: 1, monthPlan: 1, monthFact: 1 }), "В работе");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 1, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), "В работе");
assert.equal(reportRowAutoStatus({ dayPlan: 1, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), "В работе");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 1, monthPlan: 0, monthFact: 1 }), "В работе");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 1, monthPlan: 0, monthFact: 0 }), "Запланировано");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 1 }), "В работе");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 10, annualPlan: 20 }), "Запланировано");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 10, annualPlan: 10 }), "Завершена");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearFact: 10 }), "Завершена");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0, yearPlan: 0, yearFact: 0, annualPlan: 0 }), "Пусто");
assert.equal(reportRowAutoStatus({ dayPlan: 0, dayFact: 0, monthTotalPlan: 0, monthPlan: 0, monthFact: 0 }), "Пусто");
