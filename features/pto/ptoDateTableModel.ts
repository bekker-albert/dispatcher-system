import {
  ptoCarryoverIsManual,
  ptoColumnDefaults,
  ptoCustomerPlanRowSignature,
  ptoLinkedRowSignature,
  ptoRowHasYear,
  ptoStoredCarryover,
  ptoYearTotal,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";

export type PtoMonthGroupView = {
  month: string;
  label: string;
  days: string[];
  expanded: boolean;
};

export type PtoTableColumn = {
  key: string;
  width: number;
};

export type PtoRowDateTotals = {
  monthTotals: Map<string, { hasValue: boolean; value: number }>;
  yearDailyTotal: number;
};

type PtoDateTableModelOptions = {
  showCustomerCode: boolean;
  showLocation: boolean;
  planYear: string;
  reportDate: string;
  yearMonths: string[];
  monthGroups: PtoMonthGroupView[];
  editing: boolean;
  columnWidths: Record<string, number>;
};

function ptoColumnWidth(columnWidths: Record<string, number>, key: string, fallback: number) {
  const minWidth = key === "customerCode" ? 88 : 44;
  return Math.min(800, Math.max(minWidth, Math.round(columnWidths[key] ?? fallback)));
}

export function createPtoRowDateTotalsGetter(year: string) {
  const cache = new WeakMap<PtoPlanRow, PtoRowDateTotals>();

  return (row: PtoPlanRow) => {
    const cached = cache.get(row);
    if (cached) return cached;

    const monthTotals = new Map<string, { hasValue: boolean; value: number }>();
    let yearDailyTotal = 0;

    Object.entries(row.dailyPlans).forEach(([date, value]) => {
      if (!date.startsWith(year) || !Number.isFinite(value)) return;

      yearDailyTotal += value;
      const month = date.slice(0, 7);
      const current = monthTotals.get(month) ?? { hasValue: false, value: 0 };
      current.hasValue = true;
      current.value += value;
      monthTotals.set(month, current);
    });

    const totals = {
      monthTotals,
      yearDailyTotal: Math.round(yearDailyTotal * 1000000) / 1000000,
    };
    cache.set(row, totals);
    return totals;
  };
}

export function createPtoEffectiveCarryoverGetter(rows: PtoPlanRow[], year: string) {
  const effectiveCache = new Map<string, number>();
  const totalCache = new Map<string, number>();
  const rowsByYearAndSignature = new Map<string, Map<string, PtoPlanRow[]>>();

  const indexedRowsForYear = (targetYear: string) => {
    const cached = rowsByYearAndSignature.get(targetYear);
    if (cached) return cached;

    const nextIndex = new Map<string, PtoPlanRow[]>();

    rows.forEach((row) => {
      if (!ptoRowHasYear(row, targetYear)) return;

      const signature = row.customerCode
        ? `customer:${ptoCustomerPlanRowSignature(row)}`
        : `linked:${ptoLinkedRowSignature(row)}`;
      if (signature.endsWith(":")) return;

      const currentRows = nextIndex.get(signature) ?? [];
      currentRows.push(row);
      nextIndex.set(signature, currentRows);
    });

    rowsByYearAndSignature.set(targetYear, nextIndex);
    return nextIndex;
  };

  const totalWithCarryover = (row: PtoPlanRow, targetYear: string): number => {
    const cacheKey = `${row.id}:${targetYear}`;
    const cached = totalCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const value = Math.round((effectiveCarryover(row, targetYear) + ptoYearTotal(row, targetYear)) * 1000000) / 1000000;
    totalCache.set(cacheKey, value);
    return value;
  };

  const automaticCarryover = (row: PtoPlanRow, targetYear: string) => {
    const numericYear = Number(targetYear);
    if (!Number.isFinite(numericYear)) return 0;

    const rowSignature = ptoLinkedRowSignature(row);
    if (!rowSignature) return 0;

    const previousYear = String(numericYear - 1);
    const signature = row.customerCode
      ? `customer:${ptoCustomerPlanRowSignature(row)}`
      : `linked:${rowSignature}`;

    return (indexedRowsForYear(previousYear).get(signature) ?? [])
      .reduce((sum, item) => sum + totalWithCarryover(item, previousYear), 0);
  };

  const effectiveCarryover = (row: PtoPlanRow, targetYear: string): number => {
    const cacheKey = `${row.id}:${targetYear}`;
    const cached = effectiveCache.get(cacheKey);
    if (cached !== undefined) return cached;

    const value = ptoCarryoverIsManual(row, targetYear)
      ? ptoStoredCarryover(row, targetYear)
      : automaticCarryover(row, targetYear);

    effectiveCache.set(cacheKey, value);
    return value;
  };

  return (row: PtoPlanRow) => {
    const cached = effectiveCache.get(`${row.id}:${year}`);
    if (cached !== undefined) return cached;

    return effectiveCarryover(row, year);
  };
}

export function resolvePtoReadonlyExpandedMonth(reportDate: string, planYear: string, yearMonths: string[]) {
  return reportDate.startsWith(`${planYear}-`) ? reportDate.slice(0, 7) : (yearMonths[0] ?? `${planYear}-01`);
}

export function resolvePtoDisplayMonthGroups(
  monthGroups: PtoMonthGroupView[],
  editing: boolean,
  readonlyExpandedMonth: string,
) {
  if (editing) return monthGroups;

  return monthGroups.map((group) => ({
    ...group,
    expanded: group.month === readonlyExpandedMonth,
  }));
}

export function createPtoDateTableModel({
  showCustomerCode,
  showLocation,
  planYear,
  reportDate,
  yearMonths,
  monthGroups,
  editing,
  columnWidths,
}: PtoDateTableModelOptions) {
  const readonlyExpandedMonth = resolvePtoReadonlyExpandedMonth(reportDate, planYear, yearMonths);
  const displayPtoMonthGroups = resolvePtoDisplayMonthGroups(monthGroups, editing, readonlyExpandedMonth);
  const columnWidth = (key: string, fallback: number) => ptoColumnWidth(columnWidths, key, fallback);
  const baseColumns: PtoTableColumn[] = [
    ...(showCustomerCode ? [{ key: "customerCode", width: columnWidth("customerCode", ptoColumnDefaults.customerCode) }] : []),
    { key: "area", width: columnWidth("area", ptoColumnDefaults.area) },
    ...(showLocation ? [{ key: "location", width: columnWidth("location", ptoColumnDefaults.location) }] : []),
    { key: "structure", width: columnWidth("structure", ptoColumnDefaults.structure) },
    { key: "unit", width: columnWidth("unit", ptoColumnDefaults.unit) },
    { key: "status", width: columnWidth("status", ptoColumnDefaults.status) },
    { key: `carryover:${planYear}`, width: columnWidth(`carryover:${planYear}`, ptoColumnDefaults.carryover) },
    { key: "year-total", width: columnWidth("year-total", ptoColumnDefaults.yearTotal) },
  ];
  const dateColumns = displayPtoMonthGroups.flatMap((group) => [
    { key: `month-total:${group.month}`, width: columnWidth(`month-total:${group.month}`, ptoColumnDefaults.monthTotal) },
    ...(group.expanded ? group.days.map((day) => ({ key: `day:${day}`, width: columnWidth(`day:${day}`, ptoColumnDefaults.day) })) : []),
  ]);
  const tableColumns = [...baseColumns, ...dateColumns];

  return {
    displayPtoMonthGroups,
    tableColumns,
    tableMinWidth: tableColumns.reduce((sum, column) => sum + column.width, 0),
    columnWidthByKey: new Map(tableColumns.map((column) => [column.key, column.width])),
  };
}
