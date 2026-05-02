import { reportColumnKeys, type ReportColumnKey } from "../../lib/domain/reports/columns";
import { delta, formatReportWorkName, reportRowDisplayKey } from "../../lib/domain/reports/display";
import { reportYearFact } from "../../lib/domain/reports/facts";
import { reportReasonEntryKey, reportYearReasonTextWithManualOverride } from "../../lib/domain/reports/reasons";
import type { ReportRow } from "../../lib/domain/reports/types";
import { reportPrintProfile, type ReportPrintTextColumnKey } from "./reportPrintProfile";

const reportPrintRowsPerPage = reportPrintProfile.rows.perPage;
const reportPrintPageWidthBudget = reportPrintProfile.page.widthBudgetPx;
const reportPrintBaseColumnWidths = reportPrintProfile.columns.baseWidths;
const reportPrintTextColumnBounds = reportPrintProfile.columns.textBounds;

type ReportPrintLayoutOptions = {
  columnKeys?: readonly ReportColumnKey[];
  groups: Array<{ area: string; rows: ReportRow[] }>;
  reportDate: string;
  reportReasons: Record<string, string>;
  reportHeaderLabel: (key: string, fallback: string) => string;
};

type ReportBodyLayoutGroup = Array<{ rows: ReportRow[] }>;

function reportClampWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function reportPrintTextScore(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const longestWord = normalized
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}%+-]/gu, "").length)
    .reduce((max, length) => Math.max(max, length), 0);

  return Math.max(longestWord, Math.min(normalized.length, 34));
}

function reportPrintTextColumnWidthFromScore(key: ReportPrintTextColumnKey, score: number) {
  const bounds = reportPrintTextColumnBounds[key];
  return reportClampWidth(Math.round(bounds.base + score * bounds.char), bounds.min, bounds.max);
}

function reportPrintTextColumnBudget(columnKeys: readonly ReportColumnKey[]) {
  const fixedWidth = columnKeys.reduce((sum, key) => (
    key in reportPrintTextColumnBounds ? sum : sum + reportPrintBaseColumnWidths[key]
  ), 0);
  const minTextWidth = (Object.keys(reportPrintTextColumnBounds) as ReportPrintTextColumnKey[]).reduce(
    (sum, key) => sum + reportPrintTextColumnBounds[key].min,
    0,
  );

  return Math.max(minTextWidth, reportPrintPageWidthBudget - fixedWidth);
}

function reportFitPrintTextColumnWidths(widths: Record<ReportPrintTextColumnKey, number>, columnKeys: readonly ReportColumnKey[]) {
  const totalWidth = widths["work-name"] + widths["day-reason"] + widths["year-reason"];
  const textColumnBudget = reportPrintTextColumnBudget(columnKeys);
  if (totalWidth <= textColumnBudget) return widths;

  const extraWidth = totalWidth - textColumnBudget;
  const shrinkable = (Object.keys(widths) as ReportPrintTextColumnKey[]).reduce(
    (sum, key) => sum + Math.max(0, widths[key] - reportPrintTextColumnBounds[key].min),
    0,
  );

  if (shrinkable <= 0) return widths;

  return (Object.keys(widths) as ReportPrintTextColumnKey[]).reduce((next, key) => {
    const bounds = reportPrintTextColumnBounds[key];
    const keyShrinkable = Math.max(0, widths[key] - bounds.min);
    next[key] = reportClampWidth(Math.round(widths[key] - extraWidth * (keyShrinkable / shrinkable)), bounds.min, bounds.max);
    return next;
  }, { ...widths });
}

function reportPrintLastPageRows(groups: Array<{ rows: ReportRow[] }>) {
  return groups.reduce((pageRows, group) => {
    const groupRows = group.rows.length;
    if (groupRows <= 0) return pageRows;

    if (groupRows > reportPrintRowsPerPage) {
      const firstPageCapacity = pageRows > 0 ? reportPrintRowsPerPage - pageRows : 0;
      const remainingRows = groupRows - firstPageCapacity;
      const remainder = remainingRows % reportPrintRowsPerPage;
      return remainder === 0 ? reportPrintRowsPerPage : remainder;
    }

    return pageRows > 0 && pageRows + groupRows > reportPrintRowsPerPage
      ? groupRows
      : pageRows + groupRows;
  }, 0);
}

function reportPrintYearReasonText(row: ReportRow, reportDate: string, reportReasons: Record<string, string>) {
  const rowKey = reportRowDisplayKey(row);
  if (!rowKey.startsWith("summary:")) return row.yearReason;

  return reportYearReasonTextWithManualOverride(reportReasons, rowKey, reportDate, row.yearReason);
}

export function createReportPrintLayout({
  columnKeys = reportColumnKeys,
  groups,
  reportDate,
  reportReasons,
  reportHeaderLabel,
}: ReportPrintLayoutOptions) {
  const reportPrintTextScores: Record<ReportPrintTextColumnKey, number> = {
    "work-name": reportPrintTextScore(reportHeaderLabel("work-name", "Вид работ")),
    "day-reason": reportPrintTextScore(reportHeaderLabel("day-reason", "Причина за сутки")),
    "year-reason": reportPrintTextScore(reportHeaderLabel("year-reason", "Причины с накоплением")),
  };
  const addReportPrintTextScore = (key: ReportPrintTextColumnKey, value: string) => {
    reportPrintTextScores[key] = Math.max(reportPrintTextScores[key], reportPrintTextScore(value));
  };
  const {
    reportBodyRowCount,
    reportGroupStartIndexes,
  } = createReportBodyLayout(groups);

  groups.forEach((group) => {
    group.rows.forEach((row) => {
      addReportPrintTextScore("work-name", formatReportWorkName(row.name));

      if (delta(row.dayPlan, row.dayFact) < 0) {
        const rowKey = reportRowDisplayKey(row);
        addReportPrintTextScore(
          "day-reason",
          reportReasons[reportReasonEntryKey(reportDate, rowKey)] ?? row.dayReason,
        );
      }

      if (delta(row.yearPlan, reportYearFact(row)) < 0) {
        addReportPrintTextScore("year-reason", reportPrintYearReasonText(row, reportDate, reportReasons));
      }
    });
  });

  const reportPrintTextColumnWidths = reportFitPrintTextColumnWidths({
    "work-name": reportPrintTextColumnWidthFromScore(
      "work-name",
      reportPrintTextScores["work-name"],
    ),
    "day-reason": reportPrintTextColumnWidthFromScore(
      "day-reason",
      reportPrintTextScores["day-reason"],
    ),
    "year-reason": reportPrintTextColumnWidthFromScore(
      "year-reason",
      reportPrintTextScores["year-reason"],
    ),
  }, columnKeys);
  const reportPrintColumnWidths: Record<ReportColumnKey, number> = {
    ...reportPrintBaseColumnWidths,
    ...reportPrintTextColumnWidths,
  };
  const reportLastPrintPageRows = reportBodyRowCount > 0 ? reportPrintLastPageRows(groups) : 0;
  const reportMissingPrintRows = reportBodyRowCount > 0 ? reportPrintRowsPerPage - reportLastPrintPageRows : 0;
  const reportShouldFillPrintRows = reportMissingPrintRows >= reportPrintProfile.fillRows.minMissingRows
    && reportMissingPrintRows <= reportPrintProfile.fillRows.maxMissingRows;
  const reportPrintFillPaddingMm = reportShouldFillPrintRows
    ? Math.min(
      reportPrintProfile.fillRows.maxPaddingMm,
      Math.max(
        reportPrintProfile.fillRows.minPaddingMm,
        (reportMissingPrintRows * reportPrintProfile.fillRows.paddingMmPerMissingRow)
          / Math.max(reportLastPrintPageRows, 1),
      ),
    )
    : 0;

  return {
    reportBodyRowCount,
    reportGroupStartIndexes,
    reportPrintColumnWidths,
    reportLastPrintPageRows,
    reportPrintFillPaddingMm,
    reportPrintTextColumnWidths,
    reportShouldFillPrintRows,
  };
}

export function createReportBodyLayout(groups: ReportBodyLayoutGroup) {
  const reportGroupStartIndexes: number[] = [];
  let reportBodyRowCount = 0;

  groups.forEach((group) => {
    reportGroupStartIndexes.push(reportBodyRowCount);
    reportBodyRowCount += group.rows.length;
  });

  return {
    reportBodyRowCount,
    reportGroupStartIndexes,
  };
}
