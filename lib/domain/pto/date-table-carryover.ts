import { defaultPtoPlanMonth, type PtoPlanRow } from "./date-table-types";
import { ptoCustomerPlanRowSignature, ptoLinkedRowSignature } from "./date-table-signatures";
import { ptoYearTotal } from "./date-table-totals";
import { ptoRowHasYear } from "./date-table-years";

export function ptoStoredCarryover(row: PtoPlanRow, year: string) {
  return row.carryovers?.[year] ?? (year === defaultPtoPlanMonth.slice(0, 4) ? row.carryover : 0);
}

export function ptoCarryoverIsManual(row: PtoPlanRow, year: string) {
  if (row.carryoverManualYears?.includes(year)) return true;
  return !row.carryovers && year === defaultPtoPlanMonth.slice(0, 4) && row.carryover !== 0;
}

export function ptoAutoCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[], visited = new Set<string>()): number {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear)) return 0;

  const previousYear = String(numericYear - 1);
  const signature = ptoLinkedRowSignature(row);
  const customerPlanSignature = ptoCustomerPlanRowSignature(row);
  if (!signature) return 0;

  return rows
    .filter((item) => {
      const itemSignature = row.customerCode || item.customerCode
        ? ptoCustomerPlanRowSignature(item)
        : ptoLinkedRowSignature(item);

      return itemSignature === (row.customerCode ? customerPlanSignature : signature) && ptoRowHasYear(item, previousYear);
    })
    .reduce((sum, item) => sum + ptoYearTotalWithCarryover(item, previousYear, rows, visited), 0);
}

export function ptoEffectiveCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[], visited = new Set<string>()): number {
  if (ptoCarryoverIsManual(row, year)) return ptoStoredCarryover(row, year);
  return ptoAutoCarryover(row, year, rows, visited);
}

export function ptoYearTotalWithCarryover(row: PtoPlanRow, year: string, rows: PtoPlanRow[] = [row], visited = new Set<string>()): number {
  const key = `${row.id}:${year}`;
  if (visited.has(key)) return ptoYearTotal(row, year);

  const nextVisited = new Set(visited);
  nextVisited.add(key);

  return Math.round((ptoEffectiveCarryover(row, year, rows, nextVisited) + ptoYearTotal(row, year)) * 1000000) / 1000000;
}
