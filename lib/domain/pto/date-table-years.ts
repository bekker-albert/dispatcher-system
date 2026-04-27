import { uniqueSorted } from "../../utils/text";
import { defaultPtoPlanMonth, type PtoPlanRow } from "./date-table-types";

export function normalizePtoYearValue(value: string | number) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) return "";
  return String(year);
}

export function ptoYearOptions(rows: PtoPlanRow[], selectedYear: string, manualYears: string[]) {
  const years = new Set<string>([
    selectedYear,
    ...manualYears,
  ].map(normalizePtoYearValue).filter(Boolean));

  rows.forEach((row) => {
    (row.years ?? []).forEach((year) => {
      const normalizedYear = normalizePtoYearValue(year);
      if (normalizedYear) years.add(normalizedYear);
    });

    Object.keys(row.carryovers ?? {}).forEach((year) => {
      const normalizedYear = normalizePtoYearValue(year);
      if (normalizedYear) years.add(normalizedYear);
    });

    (row.carryoverManualYears ?? []).forEach((year) => {
      const normalizedYear = normalizePtoYearValue(year);
      if (normalizedYear) years.add(normalizedYear);
    });

    if ((row.years ?? []).length === 0) {
      Object.keys(row.dailyPlans).forEach((date) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          years.add(date.slice(0, 4));
        }
      });
    }
  });

  return Array.from(years).sort((a, b) => Number(a) - Number(b));
}

export function normalizeStoredPtoYears(value: unknown) {
  if (!Array.isArray(value)) return [defaultPtoPlanMonth.slice(0, 4)];

  const years = value
    .map((year) => normalizePtoYearValue(typeof year === "string" || typeof year === "number" ? year : ""))
    .filter(Boolean);

  const normalizedYears = uniqueSorted(years);
  return normalizedYears.length ? normalizedYears : [defaultPtoPlanMonth.slice(0, 4)];
}

export function removeYearFromPtoRows(rows: PtoPlanRow[], year: string) {
  return rows.map((row) => {
    const dailyPlans = Object.fromEntries(
      Object.entries(row.dailyPlans).filter(([date]) => !date.startsWith(`${year}-`)),
    );
    const carryovers = { ...(row.carryovers ?? {}) };
    delete carryovers[year];

    return {
      ...row,
      dailyPlans,
      carryovers,
      carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
      years: (row.years ?? []).filter((rowYear) => rowYear !== year),
    };
  });
}

export function ptoRowHasYear(row: PtoPlanRow, year: string) {
  return (row.years ?? []).includes(year)
    || row.carryoverManualYears?.includes(year)
    || row.carryovers?.[year] !== undefined
    || ((row.years ?? []).length === 0 && Object.keys(row.dailyPlans).some((date) => date.startsWith(`${year}-`)));
}

export function previousPtoYearLabel(year: string) {
  const numericYear = Number(year);
  return Number.isFinite(numericYear) ? String(numericYear - 1) : "\u041f\u0440\u043e\u0448\u043b\u043e\u0433\u043e \u0433\u043e\u0434\u0430";
}
