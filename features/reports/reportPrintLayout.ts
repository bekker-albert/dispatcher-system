import { reportReasonEntryKey, reportYearReasonOverrideKey } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import { delta, formatReportWorkName } from "@/lib/domain/reports/display";
import { reportYearFact } from "@/lib/domain/reports/facts";
import { reportRowDisplayKey } from "@/lib/domain/reports/display";

const reportPrintRowsPerPage = 42;
const reportPrintTextColumnBudget = 582;
const reportPrintTextColumnBounds = {
  "work-name": { min: 150, max: 225, base: 118, char: 4.2 },
  "day-reason": { min: 145, max: 230, base: 118, char: 3.8 },
  "year-reason": { min: 165, max: 260, base: 126, char: 3.8 },
} as const;

type ReportPrintTextColumnKey = keyof typeof reportPrintTextColumnBounds;

type ReportPrintLayoutOptions = {
  groups: Array<{ area: string; rows: ReportRow[] }>;
  reportDate: string;
  reportReasons: Record<string, string>;
  reportHeaderLabel: (key: string, fallback: string) => string;
};

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

function reportPrintTextColumnWidth(key: ReportPrintTextColumnKey, header: string, values: string[]) {
  const bounds = reportPrintTextColumnBounds[key];
  const score = values.reduce((max, value) => Math.max(max, reportPrintTextScore(value)), reportPrintTextScore(header));
  return reportClampWidth(Math.round(bounds.base + score * bounds.char), bounds.min, bounds.max);
}

function reportFitPrintTextColumnWidths(widths: Record<ReportPrintTextColumnKey, number>) {
  const totalWidth = widths["work-name"] + widths["day-reason"] + widths["year-reason"];
  if (totalWidth <= reportPrintTextColumnBudget) return widths;

  const extraWidth = totalWidth - reportPrintTextColumnBudget;
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

export function createReportPrintLayout({
  groups,
  reportDate,
  reportReasons,
  reportHeaderLabel,
}: ReportPrintLayoutOptions) {
  const reportPrintRows = groups.flatMap((group) => group.rows);
  const reportPrintTextColumnWidths = reportFitPrintTextColumnWidths({
    "work-name": reportPrintTextColumnWidth(
      "work-name",
      reportHeaderLabel("work-name", "Вид работ"),
      reportPrintRows.map((row) => formatReportWorkName(row.name)),
    ),
    "day-reason": reportPrintTextColumnWidth(
      "day-reason",
      reportHeaderLabel("day-reason", "Причина за сутки"),
      reportPrintRows.map((row) => {
        if (delta(row.dayPlan, row.dayFact) >= 0) return "";
        const rowKey = reportRowDisplayKey(row);
        return reportReasons[reportReasonEntryKey(reportDate, rowKey)] ?? row.dayReason;
      }),
    ),
    "year-reason": reportPrintTextColumnWidth(
      "year-reason",
      reportHeaderLabel("year-reason", "Причины с накоплением"),
      reportPrintRows.map((row) => {
        if (delta(row.yearPlan, reportYearFact(row)) >= 0) return "";
        const rowKey = reportRowDisplayKey(row);
        return reportReasons[reportYearReasonOverrideKey(reportDate, rowKey)] ?? row.yearReason;
      }),
    ),
  });
  const reportBodyRowCount = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const reportLastPrintPageRows = reportBodyRowCount > 0 ? (reportBodyRowCount % reportPrintRowsPerPage || reportPrintRowsPerPage) : 0;
  const reportMissingPrintRows = reportBodyRowCount > 0 ? reportPrintRowsPerPage - reportLastPrintPageRows : 0;
  const reportShouldFillPrintRows = reportMissingPrintRows >= 1 && reportMissingPrintRows <= 5;
  const reportPrintFillPaddingMm = reportShouldFillPrintRows
    ? Math.min(0.5, Math.max(0.08, (reportMissingPrintRows * 2.2) / Math.max(reportLastPrintPageRows, 1)))
    : 0;
  const reportGroupStartIndexes = groups.reduce<{ indexes: number[]; nextIndex: number }>(
    (acc, group) => ({
      indexes: [...acc.indexes, acc.nextIndex],
      nextIndex: acc.nextIndex + group.rows.length,
    }),
    { indexes: [], nextIndex: 0 },
  ).indexes;

  return {
    reportBodyRowCount,
    reportGroupStartIndexes,
    reportLastPrintPageRows,
    reportPrintFillPaddingMm,
    reportPrintTextColumnWidths,
    reportShouldFillPrintRows,
  };
}
