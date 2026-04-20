import { cleanAreaName, normalizeLookupValue } from "../../utils/text";
import { dateRange, nextDate, ptoEffectiveCarryover, ptoLinkedRowSignature, type PtoPlanRow } from "../pto/date-table";
import { reportYearFact } from "./facts";
import type { ReportRow } from "./types";

export type ReportPtoIndexEntry = {
  matched: number;
  rows: PtoPlanRow[];
  dailyTotals: Map<string, number>;
  prefixTotals: Array<{ date: string; value: number }>;
  carryoverTotals: Map<string, number>;
};

export type ReportPtoIndex = Map<string, ReportPtoIndexEntry>;

const defaultReportForm: ReportRow = {
  area: "Аксу",
  name: "",
  unit: "м3",
  dayPlan: 0,
  dayFact: 0,
  dayProductivity: 0,
  dayReason: "",
  monthTotalPlan: 0,
  monthPlan: 0,
  monthFact: 0,
  monthSurveyFact: 0,
  monthOperFact: 0,
  monthProductivity: 0,
  yearPlan: 0,
  yearFact: 0,
  yearSurveyFact: 0,
  yearOperFact: 0,
  yearReason: "",
  annualPlan: 0,
  annualFact: 0,
};

function sourceValue(source: { matched: boolean; value: number }, fallback: number) {
  return source.matched ? source.value : fallback;
}

export function reportPtoIndexKey(area: string, name: string) {
  return `${normalizeLookupValue(cleanAreaName(area))}::${normalizeLookupValue(name)}`;
}

function reportIndexKey(row: Pick<ReportRow, "area" | "name">) {
  return reportPtoIndexKey(row.area, row.name);
}

function rowYears(row: PtoPlanRow) {
  return new Set([
    ...(row.years ?? []),
    ...Object.keys(row.dailyPlans)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((date) => date.slice(0, 4)),
    ...Object.keys(row.carryovers ?? {}),
    ...(row.carryoverManualYears ?? []),
  ].filter((year) => /^\d{4}$/.test(year)));
}

export function buildReportPtoIndex(rows: PtoPlanRow[]): ReportPtoIndex {
  const index: ReportPtoIndex = new Map();
  const yearsBySignature = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const signature = ptoLinkedRowSignature(row);
    if (!signature) return;

    const years = yearsBySignature.get(signature) ?? new Set<string>();
    rowYears(row).forEach((year) => years.add(year));
    yearsBySignature.set(signature, years);
  });

  rows.forEach((row) => {
    if (!row.structure.trim()) return;

    const key = reportPtoIndexKey(row.area, row.structure);
    const entry = index.get(key) ?? {
      matched: 0,
      rows: [],
      dailyTotals: new Map<string, number>(),
      prefixTotals: [],
      carryoverTotals: new Map<string, number>(),
    };

    entry.matched += 1;
    entry.rows.push(row);

    Object.entries(row.dailyPlans).forEach(([date, value]) => {
      if (!Number.isFinite(value)) return;
      entry.dailyTotals.set(date, (entry.dailyTotals.get(date) ?? 0) + value);
    });

    index.set(key, entry);
  });

  index.forEach((entry) => {
    let runningTotal = 0;
    entry.prefixTotals = Array.from(entry.dailyTotals.entries())
      .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
      .map(([date, value]) => {
        runningTotal += value;
        return { date, value: runningTotal };
      });

    entry.rows.forEach((row) => {
      const signature = ptoLinkedRowSignature(row);
      const signatureYears = signature ? yearsBySignature.get(signature) : undefined;

      rowYears(row).forEach((year) => {
        const previousYear = String(Number(year) - 1);
        const hasManualCarryover = row.carryoverManualYears?.includes(year) || row.carryovers?.[year] !== undefined;
        const hasPreviousLinkedYear = Boolean(signatureYears?.has(previousYear));
        if (!hasManualCarryover && !hasPreviousLinkedYear) return;

        const value = ptoEffectiveCarryover(row, year, rows);
        if (!Number.isFinite(value) || value === 0) return;
        entry.carryoverTotals.set(year, (entry.carryoverTotals.get(year) ?? 0) + value);
      });
    });
  });

  return index;
}

export function reportSurveyCheckpoint(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const checkpointDay = Math.floor(day / 5) * 5 || day;

  return `${year}-${String(month).padStart(2, "0")}-${String(checkpointDay).padStart(2, "0")}`;
}

export function normalizeReportRow(row: Partial<ReportRow>): ReportRow {
  const normalized = {
    ...defaultReportForm,
    ...row,
  };

  return {
    ...normalized,
    dayProductivity: row.dayProductivity ?? normalized.dayFact,
    dayReason: normalized.dayReason ?? "",
    monthTotalPlan: normalized.monthTotalPlan || normalized.monthPlan,
    monthSurveyFact: row.monthSurveyFact ?? normalized.monthFact,
    monthOperFact: row.monthOperFact ?? 0,
    monthProductivity: row.monthProductivity ?? normalized.monthFact,
    yearSurveyFact: row.yearSurveyFact ?? normalized.yearFact,
    yearOperFact: row.yearOperFact ?? 0,
    yearReason: normalized.yearReason ?? "",
    annualPlan: normalized.annualPlan || normalized.yearPlan,
    annualFact: row.annualFact ?? normalized.yearFact,
  };
}

export function createReportRowFromPtoPlan(row: PtoPlanRow): ReportRow {
  return normalizeReportRow({
    area: cleanAreaName(row.area),
    name: row.structure,
    unit: row.unit === "Тонна" ? "тн" : row.unit === "Куб" ? "м3" : row.unit,
    dayReason: "",
    yearReason: "",
  });
}

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

function reportIndexEntry(index: ReportPtoIndex, report: ReportRow) {
  return index.get(reportIndexKey(report));
}

function indexedSourceValue(entry: ReportPtoIndexEntry | undefined, value: number, fallback: number) {
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

function prefixTotalThrough(entry: ReportPtoIndexEntry | undefined, date: string) {
  if (!entry) return 0;

  const index = upperBoundPrefixIndex(entry.prefixTotals, date);
  return index >= 0 ? entry.prefixTotals[index].value : 0;
}

function rangeTotal(entry: ReportPtoIndexEntry | undefined, startDate: string, endDate: string) {
  if (!entry || startDate > endDate) return 0;

  const endTotal = prefixTotalThrough(entry, endDate);
  const beforeStartIndex = upperBoundPrefixIndex(entry.prefixTotals, startDate);
  const beforeStartTotal = beforeStartIndex >= 0 && entry.prefixTotals[beforeStartIndex].date === startDate
    ? (beforeStartIndex > 0 ? entry.prefixTotals[beforeStartIndex - 1].value : 0)
    : prefixTotalThrough(entry, startDate);

  return endTotal - beforeStartTotal;
}

function exactDateTotal(entry: ReportPtoIndexEntry | undefined, date: string) {
  return entry?.dailyTotals.get(date) ?? 0;
}

function carryoverTotal(entry: ReportPtoIndexEntry | undefined, year: string) {
  return entry?.carryoverTotals.get(year) ?? 0;
}

export function deriveReportRowFromPto(
  row: ReportRow,
  reportDateValue: string,
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
): ReportRow {
  const year = reportDateValue.slice(0, 4);
  const month = reportDateValue.slice(0, 7);
  const cutoffDate = reportSurveyCheckpoint(reportDateValue);

  const dayPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date === reportDateValue),
    row.dayPlan,
  );
  const monthTotalPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(month)),
    row.monthTotalPlan,
  );
  const monthPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(month) && date <= reportDateValue),
    row.monthPlan,
  );
  const yearPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(year) && date <= reportDateValue, { includeCarryover: true, carryoverYear: year }),
    row.yearPlan,
  );
  const annualPlan = sourceValue(
    sumPtoRows(planRows, row, (date) => date.startsWith(year), { includeCarryover: true, carryoverYear: year }),
    row.annualPlan,
  );

  const dayOperFact = sumPtoRows(operRows, row, (date) => date === reportDateValue);
  const daySurveyFact = sumPtoRows(surveyRows, row, (date) => date === reportDateValue);
  const dayFact = dayOperFact.value || daySurveyFact.value || (dayOperFact.matched || daySurveyFact.matched ? 0 : row.dayFact);

  const monthSurveyFact = sourceValue(
    sumPtoRows(surveyRows, row, (date) => date.startsWith(month) && date <= cutoffDate),
    row.monthSurveyFact,
  );
  const monthOperFact = sourceValue(
    sumPtoRows(operRows, row, (date) => date.startsWith(month) && date > cutoffDate && date <= reportDateValue),
    row.monthOperFact,
  );
  const yearSurveyFact = sourceValue(
    sumPtoRows(surveyRows, row, (date) => date.startsWith(year) && date <= cutoffDate, { includeCarryover: true, carryoverYear: year }),
    row.yearSurveyFact,
  );
  const yearOperFact = sourceValue(
    sumPtoRows(operRows, row, (date) => date.startsWith(year) && date > cutoffDate && date <= reportDateValue, { includeCarryover: true, carryoverYear: year }),
    row.yearOperFact,
  );

  const monthFact = monthSurveyFact + monthOperFact || row.monthFact;
  const yearFact = yearSurveyFact + yearOperFact || row.yearFact;

  return {
    ...row,
    dayPlan,
    dayFact,
    dayProductivity: row.dayProductivity || dayFact,
    monthTotalPlan,
    monthPlan,
    monthSurveyFact,
    monthOperFact,
    monthFact,
    monthProductivity: row.monthProductivity || monthFact,
    yearPlan,
    yearSurveyFact,
    yearOperFact,
    yearFact,
    annualPlan,
    annualFact: yearFact,
  };
}

export function deriveReportRowFromPtoIndex(
  row: ReportRow,
  reportDateValue: string,
  planIndex: ReportPtoIndex,
  surveyIndex: ReportPtoIndex,
  operIndex: ReportPtoIndex,
): ReportRow {
  const year = reportDateValue.slice(0, 4);
  const month = reportDateValue.slice(0, 7);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  const cutoffDate = reportSurveyCheckpoint(reportDateValue);
  const operStartDate = nextDate(cutoffDate);
  const planEntry = reportIndexEntry(planIndex, row);
  const surveyEntry = reportIndexEntry(surveyIndex, row);
  const operEntry = reportIndexEntry(operIndex, row);

  const dayPlan = indexedSourceValue(planEntry, exactDateTotal(planEntry, reportDateValue), row.dayPlan);
  const monthTotalPlan = indexedSourceValue(planEntry, rangeTotal(planEntry, monthStart, monthEnd), row.monthTotalPlan);
  const monthPlan = indexedSourceValue(planEntry, rangeTotal(planEntry, monthStart, reportDateValue), row.monthPlan);
  const yearPlan = indexedSourceValue(planEntry, carryoverTotal(planEntry, year) + rangeTotal(planEntry, yearStart, reportDateValue), row.yearPlan);
  const annualPlan = indexedSourceValue(planEntry, carryoverTotal(planEntry, year) + rangeTotal(planEntry, yearStart, yearEnd), row.annualPlan);

  const dayOperFact = exactDateTotal(operEntry, reportDateValue);
  const daySurveyFact = exactDateTotal(surveyEntry, reportDateValue);
  const dayFact = dayOperFact || daySurveyFact || (operEntry || surveyEntry ? 0 : row.dayFact);

  const monthSurveyFact = indexedSourceValue(surveyEntry, rangeTotal(surveyEntry, monthStart, cutoffDate), row.monthSurveyFact);
  const monthOperFact = indexedSourceValue(operEntry, rangeTotal(operEntry, operStartDate, reportDateValue), row.monthOperFact);
  const yearSurveyFact = indexedSourceValue(surveyEntry, carryoverTotal(surveyEntry, year) + rangeTotal(surveyEntry, yearStart, cutoffDate), row.yearSurveyFact);
  const yearOperFact = indexedSourceValue(operEntry, carryoverTotal(operEntry, year) + rangeTotal(operEntry, operStartDate, reportDateValue), row.yearOperFact);

  const monthFact = monthSurveyFact + monthOperFact || row.monthFact;
  const yearFact = yearSurveyFact + yearOperFact || row.yearFact;

  return {
    ...row,
    dayPlan,
    dayFact,
    dayProductivity: row.dayProductivity || dayFact,
    monthTotalPlan,
    monthPlan,
    monthSurveyFact,
    monthOperFact,
    monthFact,
    monthProductivity: row.monthProductivity || monthFact,
    yearPlan,
    yearSurveyFact,
    yearOperFact,
    yearFact,
    annualPlan,
    annualFact: yearFact,
  };
}

export function reportReasonAccumulationStartDate(
  row: ReportRow,
  reportDateValue: string,
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
) {
  const yearStart = `${reportDateValue.slice(0, 4)}-01-01`;
  let startDate = yearStart;

  dateRange(yearStart, reportDateValue).forEach((date) => {
    const reportAtDate = deriveReportRowFromPto(row, date, planRows, surveyRows, operRows);
    const yearDelta = reportYearFact(reportAtDate) - reportAtDate.yearPlan;

    if (yearDelta >= 0) {
      startDate = nextDate(date);
    }
  });

  return startDate;
}

export function reportReasonAccumulationStartDateFromIndexes(
  row: ReportRow,
  reportDateValue: string,
  planIndex: ReportPtoIndex,
  surveyIndex: ReportPtoIndex,
  operIndex: ReportPtoIndex,
) {
  const yearStart = `${reportDateValue.slice(0, 4)}-01-01`;
  let startDate = yearStart;

  dateRange(yearStart, reportDateValue).forEach((date) => {
    const reportAtDate = deriveReportRowFromPtoIndex(row, date, planIndex, surveyIndex, operIndex);
    const yearDelta = reportYearFact(reportAtDate) - reportAtDate.yearPlan;

    if (yearDelta >= 0) {
      startDate = nextDate(date);
    }
  });

  return startDate;
}
