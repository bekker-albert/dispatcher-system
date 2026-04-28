import {
  ptoCustomerPlanRowSignature,
  ptoLinkedRowSignature,
  type PtoPlanRow,
} from "../pto/date-table";
import { createReportPtoCarryoverCalculator, reportPtoRowYears } from "./pto-index-carryover";
import { reportPtoIndexKey } from "./pto-index-key";
import type { ReportPtoIndex, ReportPtoIndexEntry } from "./pto-index-types";

function createReportPtoIndexEntry(): ReportPtoIndexEntry {
  return {
    matched: 0,
    rows: [],
    dailyTotals: new Map<string, number>(),
    prefixTotals: [],
    carryoverTotals: new Map<string, number>(),
  };
}

function createYearsBySignature(rows: PtoPlanRow[], includeCustomerCode: boolean) {
  const yearsBySignature = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const signature = includeCustomerCode ? ptoCustomerPlanRowSignature(row) : ptoLinkedRowSignature(row);
    if (!signature) return;

    const years = yearsBySignature.get(signature) ?? new Set<string>();
    reportPtoRowYears(row).forEach((year) => years.add(year));
    yearsBySignature.set(signature, years);
  });

  return yearsBySignature;
}

function addRowToReportPtoIndex(index: ReportPtoIndex, row: PtoPlanRow, includeCustomerCode: boolean) {
  if (!row.structure.trim()) return;

  const key = reportPtoIndexKey(row.area, row.structure, includeCustomerCode ? row.customerCode : "");
  const entry = index.get(key) ?? createReportPtoIndexEntry();

  entry.matched += 1;
  entry.rows.push(row);

  Object.entries(row.dailyPlans).forEach(([date, value]) => {
    if (!Number.isFinite(value)) return;
    entry.dailyTotals.set(date, (entry.dailyTotals.get(date) ?? 0) + value);
  });

  index.set(key, entry);
}

function applyReportPtoPrefixTotals(entry: ReportPtoIndexEntry) {
  let runningTotal = 0;
  entry.prefixTotals = Array.from(entry.dailyTotals.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, value]) => {
      runningTotal += value;
      return { date, value: runningTotal };
    });
}

function applyReportPtoCarryoverTotals(
  entry: ReportPtoIndexEntry,
  includeCustomerCode: boolean,
  yearsBySignature: Map<string, Set<string>>,
  effectiveCarryover: (row: PtoPlanRow, year: string) => number,
) {
  entry.rows.forEach((row) => {
    const signature = includeCustomerCode ? ptoCustomerPlanRowSignature(row) : ptoLinkedRowSignature(row);
    const signatureYears = signature ? yearsBySignature.get(signature) : undefined;

    reportPtoRowYears(row).forEach((year) => {
      const previousYear = String(Number(year) - 1);
      const hasManualCarryover = row.carryoverManualYears?.includes(year) || row.carryovers?.[year] !== undefined;
      const hasPreviousLinkedYear = Boolean(signatureYears?.has(previousYear));
      if (!hasManualCarryover && !hasPreviousLinkedYear) return;

      const value = effectiveCarryover(row, year);
      if (!Number.isFinite(value) || value === 0) return;
      entry.carryoverTotals.set(year, (entry.carryoverTotals.get(year) ?? 0) + value);
    });
  });
}

export function buildReportPtoIndex(rows: PtoPlanRow[], options: { includeCustomerCode?: boolean } = {}): ReportPtoIndex {
  const index: ReportPtoIndex = new Map();
  const includeCustomerCode = options.includeCustomerCode === true;
  const yearsBySignature = createYearsBySignature(rows, includeCustomerCode);
  const effectiveCarryover = createReportPtoCarryoverCalculator(rows);

  rows.forEach((row) => addRowToReportPtoIndex(index, row, includeCustomerCode));

  index.forEach((entry) => {
    applyReportPtoPrefixTotals(entry);
    applyReportPtoCarryoverTotals(entry, includeCustomerCode, yearsBySignature, effectiveCarryover);
  });

  return index;
}

export { reportIndexKey, reportPtoIndexKey } from "./pto-index-key";
export {
  carryoverTotal,
  exactDateTotal,
  indexedSourceValue,
  latestFactDateInRange,
  prefixTotalThrough,
  ptoRowMatchesReport,
  ptoRowsForReport,
  rangeTotal,
  sumPtoRows,
  sumReportPtoIndex,
} from "./pto-index-query";
export type { ReportPtoIndex, ReportPtoIndexEntry } from "./pto-index-types";
