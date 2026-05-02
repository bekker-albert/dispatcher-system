import assert from "node:assert/strict";
import * as reportDisplay from "../lib/domain/reports/display";
import { buildReportPtoIndex, normalizeReportRow } from "../lib/domain/reports/calculation";
import { deriveReportRowFromPtoIndex } from "../lib/domain/reports/pto-facts";
import { buildReportPtoIndex as buildReportPtoIndexDirect } from "../lib/domain/reports/pto-index";
import { normalizeReportRow as normalizeReportRowDirect } from "../lib/domain/reports/row-normalization";
import { reportColumnKeys } from "../lib/domain/reports/columns";
import { reportReasonEntryKey, reportYearReasonOverrideKey } from "../lib/domain/reports/reasons";
import { createReportBodyLayout, createReportPrintLayout } from "../features/reports/reportPrintLayout";
import { createReportRowDisplayViewModel } from "../features/reports/reportRowDisplayViewModel";
import type { ReportRow } from "../lib/domain/reports/types";

const expectedDisplayExports = [
  "applyReportFactSourceRows",
  "createReportFactSourceRow",
  "createReportSummaryRow",
  "delta",
  "formatNumber",
  "formatPercent",
  "formatReportDate",
  "formatReportTitleDate",
  "formatReportWorkName",
  "reportAutoColumnWidth",
  "reportCustomerEffectiveRowKeys",
  "reportCustomerUsesSummaryRows",
  "reportPtoDateStatus",
  "reportPtoDateStatusFromIndexes",
  "reportPtoDateStatusHasAny",
  "reportRowAutoStatus",
  "reportRowBasePtoKey",
  "reportRowCustomerCode",
  "reportRowDisplayKey",
  "reportRowHasAutoShowData",
  "reportRowKey",
  "reportRowMatchesCustomer",
  "reportRowsForCustomer",
  "sortAreaNamesByOrder",
  "sortReportRowsByAreaOrder",
  "statusColor",
  "statusTextColor",
] as const;

expectedDisplayExports.forEach((exportName) => {
  assert.equal(typeof reportDisplay[exportName], "function", `missing report display export: ${exportName}`);
});

assert.equal(buildReportPtoIndex, buildReportPtoIndexDirect);
assert.equal(normalizeReportRow, normalizeReportRowDirect);

const reportRow = normalizeReportRow({
  area: "Аксу",
  name: "Перевозка руды",
  unit: "м3",
  dayPlan: 10,
  dayFact: 8,
  monthPlan: 10,
  monthFact: 8,
  yearPlan: 10,
  yearFact: 8,
});

assert.equal(reportDisplay.reportRowKey(reportRow), "аксу::перевозкаруды");
assert.equal(reportDisplay.formatReportDate("2026-04-12"), "воскресенье, 12 апреля 2026 г.");
assert.equal(typeof reportDisplay.reportAutoColumnWidth("day-plan", "План", ["10"]), "number");

const summary = reportDisplay.createReportSummaryRow({ id: "sum-1", label: "Итого", unit: "м3", area: "Аксу", rowKeys: [] }, [reportRow]);
assert.equal(summary?.displayKey, "summary:sum-1");
assert.equal(summary?.dayPlan, 10);

const orderedReportRows = reportDisplay.sortReportRowsByAreaOrder([
  normalizeReportRow({ area: "Аксу", name: "Вторая работа", unit: "м3" }),
  normalizeReportRow({ area: "Аксу", name: "Первая работа", unit: "м3" }),
], ["Аксу"], {
  Аксу: [
    reportDisplay.reportRowDisplayKey(normalizeReportRow({ area: "Аксу", name: "Первая работа", unit: "м3" })),
    reportDisplay.reportRowDisplayKey(normalizeReportRow({ area: "Аксу", name: "Вторая работа", unit: "м3" })),
  ],
});
assert.deepEqual(orderedReportRows.map((row) => row.name), ["Первая работа", "Вторая работа"]);

const emptyIndex = buildReportPtoIndex([]);
const ptoStatus = reportDisplay.reportPtoDateStatusFromIndexes(reportRow, "2026-04-12", emptyIndex, emptyIndex, emptyIndex);
assert.equal(ptoStatus.planHasDateValue, false);

const derivedRow = deriveReportRowFromPtoIndex(reportRow, "2026-04-12", emptyIndex, emptyIndex, emptyIndex);
assert.equal(derivedRow.dayPlan, 10);

const reportRowDisplayKey = reportDisplay.reportRowDisplayKey(reportRow);
const rowView = createReportRowDisplayViewModel({
  groupRowCount: 3,
  reportBodyRowCount: 43,
  reportDate: "2026-04-12",
  reportLastPrintPageRows: 37,
  reportReasons: {
    [reportReasonEntryKey("2026-04-12", reportRowDisplayKey)]: "Override day reason",
    [reportYearReasonOverrideKey("2026-04-12", reportRowDisplayKey)]: "Override year reason",
  },
  reportShouldFillPrintRows: true,
  row: reportRow,
  rowIndexInGroup: 0,
  rowPrintIndex: 6,
});

assert.equal(rowView.rowKey, reportRowDisplayKey);
assert.equal(rowView.showAreaCell, true);
assert.equal(rowView.areaRowSpan, 3);
assert.equal(rowView.rowClassName, "report-print-fill-row");
assert.equal(rowView.dayDelta.value, -2);
assert.equal(rowView.dayDelta.text, "-2");
assert.equal(rowView.dayDelta.tone, "bad");
assert.equal(rowView.monthFact.value, "8");
assert.equal(rowView.monthFact.note, "марк 8");
assert.equal(rowView.monthDelta.value, -2);
assert.equal(rowView.yearFact.value, "8");
assert.equal(rowView.yearFact.note, "марк 8");
assert.equal(rowView.yearDelta.value, -2);
assert.equal(rowView.annualFact, "8");
assert.equal(rowView.annualRemaining.value, -2);
assert.equal(rowView.dayReason.key, reportReasonEntryKey("2026-04-12", reportRowDisplayKey));
assert.equal(rowView.dayReason.text, "Override day reason");
assert.equal(rowView.dayReason.missing, false);
assert.equal(rowView.yearReason.key, reportYearReasonOverrideKey("2026-04-12", reportRowDisplayKey));
assert.equal(rowView.yearReason.text, "Override year reason");
assert.equal(rowView.yearReason.missing, false);

const rowViewWithComputedYearReason = createReportRowDisplayViewModel({
  groupRowCount: 1,
  reportBodyRowCount: 1,
  reportDate: "2026-04-12",
  reportLastPrintPageRows: 1,
  reportReasons: {
    [reportYearReasonOverrideKey("2026-04-12", reportRowDisplayKey)]: "Stale manual reason",
  },
  reportShouldFillPrintRows: false,
  row: { ...reportRow, yearReason: "Computed accumulated reason" },
  rowIndexInGroup: 0,
  rowPrintIndex: 0,
  yearReasonText: "Computed accumulated reason",
});
assert.equal(rowViewWithComputedYearReason.yearReason.text, "Computed accumulated reason");

const createPrintRow = (index: number): ReportRow => ({
  area: "Aksu",
  name: `Long printable work name ${index}`,
  unit: "m3",
  dayPlan: 10,
  dayFact: 8,
  dayProductivity: 8,
  dayReason: "Vehicle repair delay",
  monthTotalPlan: 10,
  monthPlan: 10,
  monthFact: 8,
  monthSurveyFact: 0,
  monthOperFact: 8,
  monthProductivity: 8,
  yearPlan: 10,
  yearFact: 8,
  yearSurveyFact: 0,
  yearOperFact: 8,
  yearReason: "Cumulative vehicle repair delay",
  annualPlan: 10,
  annualFact: 8,
});

const printLayout = createReportPrintLayout({
  columnKeys: reportColumnKeys,
  groups: [
    { area: "Aksu", rows: Array.from({ length: 6 }, (_, index) => createPrintRow(index)) },
    { area: "Boran", rows: Array.from({ length: 37 }, (_, index) => createPrintRow(index + 6)) },
  ],
  reportDate: "2026-04-12",
  reportReasons: {},
  reportHeaderLabel: (_key, fallback) => fallback,
});

const bodyLayout = createReportBodyLayout([
  { rows: Array.from({ length: 2 }, (_, index) => createPrintRow(index)) },
  { rows: Array.from({ length: 3 }, (_, index) => createPrintRow(index + 2)) },
]);
assert.deepEqual(bodyLayout.reportGroupStartIndexes, [0, 2]);
assert.equal(bodyLayout.reportBodyRowCount, 5);
assert.equal(printLayout.reportBodyRowCount, 43);
assert.equal(printLayout.reportLastPrintPageRows, 37);
assert.equal(printLayout.reportShouldFillPrintRows, true);
assert.ok(printLayout.reportPrintFillPaddingMm > 0);
assert.equal(printLayout.reportPrintColumnWidths["day-plan"], 42);
assert.equal(printLayout.reportPrintColumnWidths["month-fact"], 58);
assert.ok(
  reportColumnKeys.reduce((sum, key) => sum + printLayout.reportPrintColumnWidths[key], 0) <= 1400,
);
const longGroupPrintLayout = createReportPrintLayout({
  columnKeys: reportColumnKeys,
  groups: [
    { area: "Aksu", rows: Array.from({ length: 6 }, (_, index) => createPrintRow(index)) },
    { area: "Boran", rows: Array.from({ length: 80 }, (_, index) => createPrintRow(index + 6)) },
  ],
  reportDate: "2026-04-12",
  reportReasons: {},
  reportHeaderLabel: (_key, fallback) => fallback,
});
assert.equal(longGroupPrintLayout.reportLastPrintPageRows, 2);
assert.equal(longGroupPrintLayout.reportShouldFillPrintRows, false);

const printLayoutWithComputedReason = createReportPrintLayout({
  columnKeys: reportColumnKeys,
  groups: [{ area: "Aksu", rows: [{ ...createPrintRow(1), yearReason: "Very long computed accumulated repair and weather reason" }] }],
  reportDate: "2026-04-12",
  reportReasons: {
    [reportYearReasonOverrideKey("2026-04-12", reportDisplay.reportRowDisplayKey(createPrintRow(1)))]: "Short stale reason",
  },
  reportHeaderLabel: (_key, fallback) => fallback,
});
assert.ok(printLayoutWithComputedReason.reportPrintColumnWidths["year-reason"] > 190);

const summaryPrintKey = "summary:test";
const printLayoutWithSummaryOverride = createReportPrintLayout({
  columnKeys: reportColumnKeys,
  groups: [{
    area: "Aksu",
    rows: [{
      ...createPrintRow(2),
      displayKey: summaryPrintKey,
      yearReason: "Short computed summary",
    }],
  }],
  reportDate: "2026-04-12",
  reportReasons: {
    [reportYearReasonOverrideKey("2026-04-12", summaryPrintKey)]: "Very long manual summary reason for accumulated report output",
  },
  reportHeaderLabel: (_key, fallback) => fallback,
});
assert.ok(printLayoutWithSummaryOverride.reportPrintColumnWidths["year-reason"] > 190);

const printLayoutWithCoveredSummaryOverride = createReportPrintLayout({
  columnKeys: reportColumnKeys,
  groups: [{
    area: "Aksu",
    rows: [{
      ...createPrintRow(3),
      displayKey: summaryPrintKey,
      yearReason: "Repair delay and weather delay",
    }],
  }],
  reportDate: "2026-04-12",
  reportReasons: {
    [reportYearReasonOverrideKey("2026-04-12", summaryPrintKey)]: "Repair delay",
  },
  reportHeaderLabel: (_key, fallback) => fallback,
});
assert.ok(printLayoutWithCoveredSummaryOverride.reportPrintColumnWidths["year-reason"] > 190);
