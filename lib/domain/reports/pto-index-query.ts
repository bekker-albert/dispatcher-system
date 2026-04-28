import { normalizeLookupValue } from "../../utils/text";
import { ptoEffectiveCarryover, type PtoPlanRow } from "../pto/date-table";
import { reportIndexKey } from "./pto-index-key";
import type { ReportPtoIndex, ReportPtoIndexEntry } from "./pto-index-types";
import type { ReportRow } from "./types";

export function ptoRowMatchesReport(row: PtoPlanRow, report: ReportRow) {
  return normalizeLookupValue(row.area) === normalizeLookupValue(report.area)
    && normalizeLookupValue(row.structure) === normalizeLookupValue(report.name);
}

export function ptoRowsForReport(rows: PtoPlanRow[], report: ReportRow) {
  return rows.filter((row) => ptoRowMatchesReport(row, report));
}

export function sumPtoRows(
  rows: PtoPlanRow[],
  report: ReportRow,
  includeDate: (date: string) => boolean,
  options: { includeCarryover?: boolean; carryoverYear?: string } = {},
) {
  const matchedRows = ptoRowsForReport(rows, report);

  return {
    matched: matchedRows.length > 0,
    value: matchedRows.reduce((sum, row) => (
      sum + (options.includeCarryover && options.carryoverYear ? ptoEffectiveCarryover(row, options.carryoverYear, rows) : 0) + Object.entries(row.dailyPlans).reduce((rowSum, [date, value]) => (
        includeDate(date) ? rowSum + value : rowSum
      ), 0)
    ), 0),
  };
}

export function sumReportPtoIndex(
  index: ReportPtoIndex,
  report: ReportRow,
  includeDate: (date: string) => boolean,
  options: { includeCarryover?: boolean; carryoverYear?: string } = {},
) {
  const entry = index.get(reportIndexKey(report));
  if (!entry) return { matched: false, value: 0 };

  let value = options.includeCarryover && options.carryoverYear
    ? entry.carryoverTotals.get(options.carryoverYear) ?? 0
    : 0;

  entry.dailyTotals.forEach((dailyValue, date) => {
    if (includeDate(date)) value += dailyValue;
  });

  return { matched: entry.matched > 0, value };
}

export function indexedSourceValue(entry: ReportPtoIndexEntry | undefined, value: number, fallback: number) {
  return entry ? value : fallback;
}

function upperBoundPrefixIndex(prefixTotals: Array<{ date: string; value: number }>, date: string) {
  let low = 0;
  let high = prefixTotals.length;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (prefixTotals[middle].date <= date) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low - 1;
}

export function prefixTotalThrough(entry: ReportPtoIndexEntry | undefined, date: string) {
  if (!entry) return 0;

  const index = upperBoundPrefixIndex(entry.prefixTotals, date);
  return index >= 0 ? entry.prefixTotals[index].value : 0;
}

export function rangeTotal(entry: ReportPtoIndexEntry | undefined, startDate: string, endDate: string) {
  if (!entry || startDate > endDate) return 0;

  const endTotal = prefixTotalThrough(entry, endDate);
  const beforeStartIndex = upperBoundPrefixIndex(entry.prefixTotals, startDate);
  const beforeStartTotal = beforeStartIndex >= 0 && entry.prefixTotals[beforeStartIndex].date === startDate
    ? (beforeStartIndex > 0 ? entry.prefixTotals[beforeStartIndex - 1].value : 0)
    : prefixTotalThrough(entry, startDate);

  return endTotal - beforeStartTotal;
}

export function exactDateTotal(entry: ReportPtoIndexEntry | undefined, date: string) {
  return entry?.dailyTotals.get(date) ?? 0;
}

export function carryoverTotal(entry: ReportPtoIndexEntry | undefined, year: string) {
  return entry?.carryoverTotals.get(year) ?? 0;
}

export function latestFactDateInRange(entry: ReportPtoIndexEntry | undefined, startDate: string, endDate: string) {
  if (!entry || startDate > endDate) return null;

  const endIndex = upperBoundPrefixIndex(entry.prefixTotals, endDate);
  for (let index = endIndex; index >= 0; index -= 1) {
    const date = entry.prefixTotals[index].date;
    if (date < startDate) return null;
    if (Math.abs(entry.dailyTotals.get(date) ?? 0) < 0.000001) continue;
    return date;
  }

  return null;
}
