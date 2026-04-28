import {
  ptoCarryoverIsManual,
  ptoCustomerPlanRowSignature,
  ptoLinkedRowSignature,
  ptoStoredCarryover,
  ptoYearTotal,
  type PtoPlanRow,
} from "../pto/date-table";

export function reportPtoRowYears(row: PtoPlanRow) {
  return new Set([
    ...(row.years ?? []),
    ...Object.keys(row.dailyPlans)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((date) => date.slice(0, 4)),
    ...Object.keys(row.carryovers ?? {}),
    ...(row.carryoverManualYears ?? []),
  ].filter((year) => /^\d{4}$/.test(year)));
}

export function reportYearCandidateKey(signature: string, year: string) {
  return `${signature}::${year}`;
}

function addReportYearCandidate(
  target: Map<string, PtoPlanRow[]>,
  signature: string,
  year: string,
  row: PtoPlanRow,
) {
  if (!signature) return;
  const key = reportYearCandidateKey(signature, year);
  const rows = target.get(key);
  if (rows) {
    rows.push(row);
    return;
  }
  target.set(key, [row]);
}

function roundReportPtoValue(value: number) {
  return Math.round(value * 1000000) / 1000000;
}

export function createReportPtoCarryoverCalculator(rows: PtoPlanRow[]) {
  const linkedRowsByYear = new Map<string, PtoPlanRow[]>();
  const customerRowsByYear = new Map<string, PtoPlanRow[]>();
  const yearTotalCache = new Map<string, number>();
  const yearTotalWithCarryoverCache = new Map<string, number>();

  rows.forEach((row) => {
    const linkedSignature = ptoLinkedRowSignature(row);
    const customerSignature = ptoCustomerPlanRowSignature(row);

    reportPtoRowYears(row).forEach((year) => {
      if (!row.customerCode) addReportYearCandidate(linkedRowsByYear, linkedSignature, year, row);
      addReportYearCandidate(customerRowsByYear, customerSignature, year, row);
    });
  });

  const rowYearTotal = (row: PtoPlanRow, year: string) => {
    const key = `${row.id}:${year}`;
    const cached = yearTotalCache.get(key);
    if (cached !== undefined) return cached;

    const total = ptoYearTotal(row, year);
    yearTotalCache.set(key, total);
    return total;
  };

  const totalWithCarryover = (row: PtoPlanRow, year: string, visited: Set<string>): number => {
    const key = `${row.id}:${year}`;
    if (visited.has(key)) return rowYearTotal(row, year);

    const cached = yearTotalWithCarryoverCache.get(key);
    if (cached !== undefined) return cached;

    const nextVisited = new Set(visited);
    nextVisited.add(key);
    const total = roundReportPtoValue(effectiveCarryover(row, year, nextVisited) + rowYearTotal(row, year));
    yearTotalWithCarryoverCache.set(key, total);
    return total;
  };

  const effectiveCarryover = (row: PtoPlanRow, year: string, visited = new Set<string>()): number => {
    if (ptoCarryoverIsManual(row, year)) return ptoStoredCarryover(row, year);

    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return 0;

    const linkedSignature = ptoLinkedRowSignature(row);
    if (!linkedSignature) return 0;

    const previousYear = String(numericYear - 1);
    const targetSignature = row.customerCode
      ? ptoCustomerPlanRowSignature(row)
      : linkedSignature;
    const candidates = (row.customerCode ? customerRowsByYear : linkedRowsByYear).get(
      reportYearCandidateKey(targetSignature, previousYear),
    ) ?? [];

    return candidates.reduce((sum, item) => sum + totalWithCarryover(item, previousYear, visited), 0);
  };

  return effectiveCarryover;
}
