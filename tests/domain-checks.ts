import assert from "node:assert/strict";
import { adminLogLimit, normalizeAdminLogEntry } from "../lib/domain/admin/logs";
import { adminSectionTabs, structureSectionTabs } from "../lib/domain/admin/navigation";
import { defaultDependencyLinks, defaultDependencyNodes, defaultOrgMembers, dependencyNodeLabel, dependencyStages, orgMemberLabel } from "../lib/domain/admin/structure";
import { buildDispatchAiSuggestion, consolidateDispatchSummaryRows, createDispatchSummaryRow, normalizeDispatchSummaryRows } from "../lib/domain/dispatch/summary";
import { compactSubTabLabel, compactTopTabLabel, createDefaultSubTabs, customTabKey, defaultTopTabs, normalizeStoredCustomTabs, normalizeStoredSubTabs, normalizeStoredTopTabs } from "../lib/domain/navigation/tabs";
import { isLoadingEquipment, loadingEquipmentLabel, normalizePtoBucketManualRows, ptoBucketCellKey, ptoBucketRowKey, ptoBucketSelectionKey } from "../lib/domain/pto/buckets";
import { createEmptyPtoDateRow, dateRange, distributeMonthlyTotal, insertPtoRowAfter, nextDate, normalizePtoCustomerCode, normalizePtoPlanRow, ptoAreaMatches, ptoColumnDefaults, ptoEffectiveCarryover, ptoFieldLogLabel, ptoLinkedRowMatches, ptoLinkedRowSignature, ptoRowFieldDomKey, reorderPtoRows } from "../lib/domain/pto/date-table";
import { defaultPtoOperRows, defaultPtoPlanRows, defaultPtoSurveyRows, defaultReportDate } from "../lib/domain/pto/defaults";
import { createPtoPlanExportRows, createPtoPlanRowsFromImportTable, ensureImportedRowsInLinkedPtoTable, mergeImportedPtoPlanRows, ptoDateExportFileName, ptoDateTableMeta } from "../lib/domain/pto/excel";
import { formatBucketNumber, formatPtoCellNumber, formatPtoFormulaNumber, parseDecimalInput, parseDecimalValue } from "../lib/domain/pto/formatting";
import { calculatePtoVirtualRows } from "../lib/domain/pto/virtualization";
import { buildReportPtoIndex, createReportRowFromPtoPlan, deriveReportRowFromPto, deriveReportRowFromPtoIndex } from "../lib/domain/reports/calculation";
import { normalizeStoredReportCustomers } from "../lib/domain/reports/customers";
import { defaultReportCustomerId, defaultReportCustomers, defaultReportRows } from "../lib/domain/reports/defaults";
import { createReportSummaryRow, delta, formatReportTitleDate, reportAutoColumnWidth, reportCustomerEffectiveRowKeys, reportRowAutoStatus, reportRowHasAutoShowData, reportRowKey, reportRowsForCustomer } from "../lib/domain/reports/display";
import { reportYearFact } from "../lib/domain/reports/facts";
import { aggregateReportReasons, reportReasonEntryKey, reportYearReasonValue } from "../lib/domain/reports/reasons";
import { defaultContractors, defaultFuelContractors, defaultFuelGeneral, defaultUserCard } from "../lib/domain/reference/defaults";
import { createDefaultVehicles, createVehicleSeedVersion, defaultVehicleFallbackRows, defaultVehicleForm, normalizeVehicleRow } from "../lib/domain/vehicles/defaults";
import { buildVehicleDisplayName, createVehicleExportRows, createVehiclesFromImportTable } from "../lib/domain/vehicles/import-export";
import { createVehicleFilterOptions, vehicleMatchesFilters } from "../lib/domain/vehicles/filtering";
import { adminVehicleFallbackPreviewRows, adminVehicleMinPreviewRows, adminVehicleViewportBottomReserve, parseVehicleInlineFieldDomKey, vehicleAutocompleteFilterKeys, vehicleFieldIsNumeric, vehicleFilterColumnConfigs, vehicleInlineFieldDomKey, vehicleInlineFields } from "../lib/domain/vehicles/grid";
import { adminStorageKeys } from "../lib/storage/keys";
import { createId } from "../lib/utils/id";
import { parseDecimalInput as parseUtilityDecimalInput } from "../lib/utils/numbers";
import { mergeDefaultsById, normalizeDecimalRecord, normalizeNumberRecord, normalizeStringList, normalizeStringListRecord, normalizeStringRecord } from "../lib/utils/normalizers";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "../lib/utils/text";

const nbsp = "\u00a0";

assert.equal(parseDecimalInput(" 1 234,56 "), 1234.56);
assert.equal(parseUtilityDecimalInput("12,5"), 12.5);
assert.equal(parseDecimalInput("-"), null);
assert.equal(parseDecimalValue("bad"), 0);
assert.equal(formatPtoCellNumber(1234.567), `1${nbsp}234,57`);
assert.equal(formatPtoFormulaNumber(12.3456789), "12,345679");
assert.equal(formatBucketNumber(3), "3,00");
assert.deepEqual(mergeDefaultsById([{ id: "a", value: 1 }], [{ id: "a", value: 2 }, { id: "b", value: 3 }]), [{ id: "a", value: 1 }, { id: "b", value: 3 }]);
assert.deepEqual(normalizeNumberRecord({ a: 4.6, b: -2, c: 99, "": 3, bad: "x" }, 0, 10), { a: 5, b: 0, c: 10 });
assert.deepEqual(normalizeDecimalRecord({ a: 1.236, b: -1, c: 100 }, 0, 10, 2), { a: 1.24, b: 0, c: 10 });
assert.deepEqual(normalizeStringRecord({ a: " value ", b: "", c: 3 }), { a: "value" });
assert.deepEqual(normalizeStringList([" a ", "a", "", 5, "b"]), ["a", "b"]);
assert.deepEqual(normalizeStringListRecord({ " Уч_Аксу ": [" a ", "a", "", 5, "b"] }), { аксу: ["a", "b"] });
assert.equal(normalizeLookupValue("Уч_Аксу / Карьер"), "аксукарьер");
assert.equal(cleanAreaName("Уч_Акбакай"), "Акбакай");
assert.deepEqual(uniqueSorted(["Б", "А", "А", " "]), ["А", "Б"]);
assert.equal(createId().includes("-"), true);
assert.equal(adminStorageKeys.vehicles, "dispatcher:vehicles");
assert.equal(ptoBucketRowKey("Уч_Аксу", "Подача"), "аксу:подача");
assert.equal(ptoBucketCellKey("row", "equipment"), "row::equipment");
assert.equal(ptoBucketSelectionKey({ rowKey: "row", equipmentKey: "equipment" }), "row::equipment");
assert.equal(normalizePtoBucketManualRows([{ area: "Уч_Аксу", structure: "Подача" }, { area: "Аксу", structure: "Подача" }]).length, 1);
assert.equal(normalizeAdminLogEntry({ action: "Удаление", section: "Техника", details: "Удалена строка" })?.action, "Удаление");
assert.equal(normalizeAdminLogEntry({ action: "bad" }), null);
assert.equal(adminLogLimit, 200);
assert.deepEqual(dateRange("2026-04-01", "2026-04-03"), ["2026-04-01", "2026-04-02", "2026-04-03"]);
assert.equal(nextDate("2026-04-30"), "2026-05-01");
assert.deepEqual(distributeMonthlyTotal(10, ["2026-04-01", "2026-04-02", "2026-04-03"]), { "2026-04-01": 3.334, "2026-04-02": 3.333, "2026-04-03": 3.333 });
assert.equal(ptoColumnDefaults.structure, 250);
assert.equal(defaultReportDate, "2026-04-12");
assert.equal(defaultPtoPlanRows.length, 5);
assert.equal(defaultPtoSurveyRows.length, 5);
assert.equal(defaultPtoOperRows.length, 5);
assert.equal(defaultPtoPlanRows[0].dailyPlans[defaultReportDate], 2064);
assert.equal(defaultOrgMembers.length, 3);
assert.equal(adminSectionTabs.some((tab) => tab.value === "vehicles"), true);
assert.equal(structureSectionTabs.at(-1)?.value, "schedule");
assert.equal(defaultDependencyNodes.some((node) => node.id === "reports"), true);
assert.equal(defaultDependencyLinks.every((link) => defaultDependencyNodes.some((node) => node.id === link.fromNodeId) && defaultDependencyNodes.some((node) => node.id === link.toNodeId)), true);
assert.equal(dependencyStages.at(-1)?.nodeIds.includes("reports"), true);
assert.equal(orgMemberLabel(defaultOrgMembers[0]).includes(defaultOrgMembers[0].name), true);
assert.equal(dependencyNodeLabel(defaultDependencyNodes, "reports"), defaultDependencyNodes.find((node) => node.id === "reports")?.name);
assert.equal(defaultContractors["AA Mining"].length, 2);
assert.equal(defaultFuelGeneral[0].debt, 0);
assert.equal(defaultFuelContractors[0].contractor, "Qaz Trucks");
assert.equal(defaultUserCard.fullName, "Альберт");
const defaultSubTabs = createDefaultSubTabs(["AA Mining"]);
assert.equal(defaultSubTabs.contractors[0].value, "AA Mining");
assert.equal(normalizeStoredTopTabs([{ id: "admin", label: "", visible: false }]).find((tab) => tab.id === "admin")?.visible, true);
assert.equal(normalizeStoredSubTabs({ pto: [{ id: "custom", label: " Custom ", value: "", visible: true }] }, defaultSubTabs).pto.some((tab) => tab.id === "custom" && tab.label === "Custom"), true);
assert.equal(customTabKey("abc"), "custom:abc");
assert.equal(compactTopTabLabel(defaultTopTabs.find((tab) => tab.id === "dispatch")!), defaultTopTabs.find((tab) => tab.id === "dispatch")?.label);
assert.equal(compactSubTabLabel("pto", { id: "x", label: "Custom", value: "custom", visible: true }), "Custom");
assert.deepEqual(normalizeStoredCustomTabs([{ id: "c", title: " Custom ", description: " Text ", items: ["a", 1], visible: true }]), [{ id: "c", title: "Custom", description: "Text", items: ["a"], visible: true }]);

assert.equal(
  aggregateReportReasons(["В связи с отсутствием ГСМ (22 ч.)"]),
  `В связи с отсутствием ГСМ${nbsp}(22${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["В связи с отсутствием ГСМ (22 ч.,"]),
  `В связи с отсутствием ГСМ${nbsp}(22${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Неблагоприятные погодные условия\n(дождь, снег, метель - 10 ч.)"]),
  `Погодные условия${nbsp}(10${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Простой ДСК (5 ч.)", "Простой ДСК (3 ч.)"]),
  `Простой ДСК${nbsp}(8${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons(["Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)"]),
  `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)`,
);

assert.equal(
  aggregateReportReasons([
    "Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)\nНеблагоприятные погодные условия\n(дождь, снег - 10 ч.)",
    "Ремонт транспортировочной техники:\n1 ед. самосвала (3 ч.)",
  ]),
  `Ремонт транспортировочной техники${nbsp}(9${nbsp}ч.)\nПогодные условия${nbsp}(10${nbsp}ч.)`,
);

const reasonRowKey = "аксу::отсыпка";
const reasonMap = {
  [reportReasonEntryKey("2026-04-17", reasonRowKey)]: "Ремонт транспортировочной техники:\n1 ед. самосвала (6 ч.)",
  [reportReasonEntryKey("2026-04-18", reasonRowKey)]: "Неблагоприятные погодные условия\n(дождь - 10 ч.)",
  [`year:2026-04-18||${reasonRowKey}`]: `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)`,
};

assert.equal(
  reportYearReasonValue(reasonMap, reasonRowKey, "2026-04-18", "", "2026-01-01"),
  `Ремонт транспортировочной техники${nbsp}(6${nbsp}ч.)\nПогодные условия${nbsp}(10${nbsp}ч.)`,
);

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

const normalizedReportCustomers = normalizeStoredReportCustomers([
  {
    id: "customer",
    label: " Заказчик ",
    visible: true,
    autoShowRows: true,
    rowKeys: ["a", "a"],
    hiddenRowKeys: ["b", "b"],
    rowLabels: { a: " Вид работ " },
    summaryRows: [{ id: "s", label: " ", unit: "м3", area: "Аксу", rowKeys: ["a", "a"] }],
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
  summaryRows: [],
}]);
assert.equal(normalizedReportCustomers[0].label, "Заказчик");
assert.deepEqual(normalizedReportCustomers[0].rowKeys, ["a"]);
assert.deepEqual(normalizedReportCustomers[0].summaryRows[0].rowKeys, ["a"]);
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
    summaryRows: [],
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

const defaultVehicle = {
  id: 0,
  name: "",
  brand: "",
  model: "",
  plateNumber: "",
  garageNumber: "",
  vehicleType: "",
  equipmentType: "",
  manufactureYear: "",
  fuelNormWinter: 0,
  fuelNormSummer: 0,
  fuelCalcType: "Моточасы" as const,
  vin: "",
  owner: "",
  area: "",
  location: "",
  workType: "",
  excavator: "",
  work: 0,
  rent: 0,
  repair: 0,
  downtime: 0,
  trips: 0,
  active: true,
  visible: true,
};
const seedVehicles = createDefaultVehicles([{ category: "Транспортировочная", equipmentType: "Самосвал", brand: "Howo", model: "371", plateNumber: "915FZ02", garageNumber: "P129", owner: "AA Mining" }], [defaultVehicle]);
assert.equal(createVehicleSeedVersion(seedVehicles.map((vehicle) => ({ category: vehicle.vehicleType, equipmentType: vehicle.equipmentType, brand: vehicle.brand, model: vehicle.model, plateNumber: vehicle.plateNumber, garageNumber: vehicle.garageNumber, owner: vehicle.owner }))), "excel-tech-list-1-2026-04-18");
assert.equal(seedVehicles[0].fuelCalcType, "Пробег");
assert.equal(seedVehicles[0].name, "Howo 371 - P129(915FZ02)");
assert.equal(isLoadingEquipment({ ...seedVehicles[0], vehicleType: "Экскаватор" }), true);
assert.equal(loadingEquipmentLabel({ brand: "Komatsu", model: "PC1250", name: "" }), "Komatsu PC1250");
assert.equal(defaultVehicleFallbackRows.length, 5);
assert.equal(createDefaultVehicles([])[0].name, defaultVehicleFallbackRows[0].name);
assert.equal(normalizeVehicleRow({ ...defaultVehicleForm, brand: "Toyota", model: "Hilux", garageNumber: "P1", plateNumber: "A1", equipmentType: "" }).equipmentType, "");
assert.deepEqual(vehicleInlineFields.slice(0, 3), ["vehicleType", "equipmentType", "brand"]);
assert.equal(adminVehicleFallbackPreviewRows >= adminVehicleMinPreviewRows, true);
assert.equal(adminVehicleViewportBottomReserve > 0, true);
assert.equal(vehicleAutocompleteFilterKeys.includes("owner"), true);
assert.equal(vehicleFilterColumnConfigs.find((column) => column.key === "manufactureYear")?.label, "Год выпуска");
assert.equal(vehicleInlineFieldDomKey(7, "brand"), "7:brand");
assert.deepEqual(parseVehicleInlineFieldDomKey("7:brand"), { vehicleId: 7, field: "brand" });
assert.equal(parseVehicleInlineFieldDomKey("bad:brand"), null);
assert.equal(vehicleFieldIsNumeric("manufactureYear"), true);
const importedVehicles = createVehiclesFromImportTable([
  ["Показ", "Категория техники", "Тип техники", "Марка", "Модель", "Госномер", "Гарномер", "Год выпуска", "VIN", "Собственник"],
  ["Скрыта", "Транспортировочная", "Самосвал", "Howo", "371", "915FZ02", "P129", "2020", "VIN-1", "AA Mining"],
], defaultVehicle);

assert.equal(importedVehicles.length, 1);
assert.equal(importedVehicles[0].visible, false);
assert.equal(importedVehicles[0].fuelCalcType, "Пробег");
assert.equal(buildVehicleDisplayName(importedVehicles[0]), "Howo 371 - P129(915FZ02)");
assert.deepEqual(createVehicleExportRows(importedVehicles)[1].slice(0, 3), ["Скрыта", "Транспортировочная", "Самосвал"]);
assert.deepEqual(createVehicleFilterOptions(importedVehicles, { getValue: (vehicle) => vehicle.owner }), ["AA Mining"]);
assert.equal(
  vehicleMatchesFilters(importedVehicles[0], { owner: ["AA Mining"] }, [{ key: "owner", getValue: (vehicle) => vehicle.owner }]),
  true,
);

const importedPtoRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Вид работ", "Ед.", "Итого 04.2026"],
  ["Аксу", "Подача руды", "тн", "30"],
], "2026", []);
const importedPtoCustomerRows = createPtoPlanRowsFromImportTable([
  ["Участок", "Заказчик", "Вид работ", "Ед.", "Итого 04.2026"],
  ["Аксу", "AAE", "Подача руды", "тн", "30"],
], "2026", []);
assert.equal(importedPtoRows.length, 1);
assert.equal(importedPtoRows[0].dailyPlans["2026-04-01"], 1);
assert.equal(importedPtoCustomerRows[0].customerCode, "AAE");
assert.equal(createPtoPlanExportRows(importedPtoRows, "2026", "Все участки")[1][1], "Аксу");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки")[0][0], "Заказчик");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки")[1][0], "AAE");
assert.equal(createPtoPlanExportRows(importedPtoCustomerRows, "2026", "Все участки", "oper")[0][1], "Вид работ");
assert.equal(mergeImportedPtoPlanRows([planRow], importedPtoRows).length, 2);
assert.equal(ensureImportedRowsInLinkedPtoTable([], importedPtoRows, "2026")[0].id, importedPtoRows[0].id);
assert.equal(normalizePtoCustomerCode(" aae "), "AAE");
assert.equal(ptoDateTableMeta("oper").label, "Оперучет");
assert.equal(ptoDateExportFileName(ptoDateTableMeta("plan"), "2026", "Уч_Аксу"), "pto-plan-2026-Аксу.xlsx");

const dispatchVehicle = { ...defaultVehicle, id: 7, brand: "Howo", model: "371", garageNumber: "P129", plateNumber: "915FZ02", work: 2, trips: 3 };
const nightDispatch = createDispatchSummaryRow(dispatchVehicle, "2026-04-18", "night", "night");
const dayDispatch = { ...createDispatchSummaryRow(dispatchVehicle, "2026-04-18", "day", "day"), reason: "Ремонт (2 ч.)", downtimeHours: 2 };
const consolidatedDispatch = consolidateDispatchSummaryRows([nightDispatch, dayDispatch], "2026-04-18");

assert.equal(consolidatedDispatch.length, 1);
assert.equal(consolidatedDispatch[0].planVolume, 400);
assert.equal(consolidatedDispatch[0].trips, 6);
assert.equal(consolidatedDispatch[0].reason, "Ремонт (2 ч.)");
assert.equal(normalizeDispatchSummaryRows([{ id: "x", shift: "bad", planVolume: "12,5" }], "2026-04-18")?.[0].planVolume, 12.5);
assert.equal(buildDispatchAiSuggestion([dayDispatch]).includes("простой 2 ч."), true);

console.log("Domain checks passed");
