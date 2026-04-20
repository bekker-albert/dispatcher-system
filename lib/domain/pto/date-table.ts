import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "../../utils/text";
import { createId } from "../../utils/id";

export type PtoPlanRow = {
  id: string;
  area: string;
  location: string;
  structure: string;
  unit: string;
  coefficient: number;
  status: string;
  carryover: number;
  carryovers?: Record<string, number>;
  carryoverManualYears?: string[];
  dailyPlans: Record<string, number>;
  years?: string[];
};

export type PtoStatus = "Новая" | "В работе" | "Завершена" | "Запланировано";

export type PtoDateTableKey = "plan" | "oper" | "survey";
export type PtoDropPosition = "before" | "after";

export const defaultPtoPlanMonth = "2026-04";
export const ptoColumnDefaults = {
  area: 138,
  location: 150,
  structure: 250,
  unit: 58,
  coefficient: 82,
  status: 118,
  carryover: 110,
  yearTotal: 118,
  monthTotal: 104,
  day: 86,
};
export const ptoUnitOptions = ["м2", "м3", "тн"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function dateRange(start: string, end: string) {
  const result: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const final = new Date(`${end}T00:00:00`);

  while (current <= final) {
    result.push(formatLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return formatLocalDateKey(date);
}

function formatLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function distributeTotal(target: Record<string, number>, days: string[], total: number) {
  if (!days.length || !total) return;
  const dailyValue = total / days.length;
  days.forEach((day) => {
    target[day] = Number(dailyValue.toFixed(6));
  });
}

export function distributeMonthlyTotal(total: number, days: string[]) {
  if (!Number.isFinite(total) || days.length === 0) return {};

  const totalThousands = Math.round(total * 1000);
  const sign = totalThousands < 0 ? -1 : 1;
  const absoluteThousands = Math.abs(totalThousands);
  const baseThousands = Math.floor(absoluteThousands / days.length);
  const remainderThousands = absoluteThousands % days.length;

  return days.reduce<Record<string, number>>((values, day, index) => {
    values[day] = (sign * (baseThousands + (index < remainderThousands ? 1 : 0))) / 1000;
    return values;
  }, {});
}

export function monthDays(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const daysCount = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: daysCount }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

export function yearMonths(year: string) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

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
    Object.keys(row.dailyPlans).forEach((date) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        years.add(date.slice(0, 4));
      }
    });
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
    || Object.keys(row.dailyPlans).some((date) => date.startsWith(`${year}-`))
    || row.carryoverManualYears?.includes(year)
    || row.carryovers?.[year] !== undefined;
}

export function ptoMonthTotal(row: PtoPlanRow, month: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(month) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}

export function ptoYearTotal(row: PtoPlanRow, year: string) {
  const total = Object.entries(row.dailyPlans).reduce((sum, [date, value]) => (
    date.startsWith(year) ? sum + value : sum
  ), 0);

  return Math.round(total * 1000000) / 1000000;
}

export function normalizePtoUnit(value: string | undefined) {
  const text = (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

  if (text === "м2" || text === "м²" || text.includes("кв")) return "м2";
  if (text === "м3" || text === "м³" || text.includes("куб")) return "м3";
  if (text === "т" || text === "тн" || text.includes("тон")) return "тн";
  if ((ptoUnitOptions as readonly string[]).includes(text)) return text;
  return "м3";
}

export function ptoAutomatedStatus(row: PtoPlanRow, selectedDate: string): PtoStatus {
  const month = selectedDate.slice(0, 7);
  const filledDates = Object.entries(row.dailyPlans)
    .filter(([, value]) => Number.isFinite(value))
    .map(([date]) => date)
    .sort();

  if (filledDates.length === 0) return "Новая";
  if (filledDates.some((date) => date.startsWith(month) && date <= selectedDate)) return "В работе";
  if (filledDates.some((date) => date > selectedDate)) return "Запланировано";
  return "Завершена";
}

export function ptoStatusRowBackground(status: PtoStatus) {
  if (status === "Новая") return "#f8fafc";
  if (status === "В работе") return "#f0fdf4";
  if (status === "Завершена") return "#fff1f2";
  return "#eff6ff";
}

export function previousPtoYearLabel(year: string) {
  const numericYear = Number(year);
  return Number.isFinite(numericYear) ? String(numericYear - 1) : "прошлого года";
}

export function ptoLinkedRowSignature(row: PtoPlanRow) {
  const signature = [
    cleanAreaName(row.area),
    row.structure,
    row.unit,
  ].map(normalizeLookupValue).join(":");

  return signature === "::" ? "" : signature;
}

export function ptoAreaMatches(rowArea: string, filterArea: string) {
  return filterArea === "Все участки" || normalizeLookupValue(rowArea) === normalizeLookupValue(filterArea);
}

export function ptoLinkedRowMatches(row: PtoPlanRow, id: string, signature: string) {
  return row.id === id || (signature !== "" && ptoLinkedRowSignature(row) === signature);
}

export function reorderPtoRows(
  rows: PtoPlanRow[],
  sourceId: string,
  sourceSignature: string,
  targetId: string,
  targetSignature: string,
  position: PtoDropPosition,
) {
  const sourceIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, sourceId, sourceSignature));
  const targetIndex = rows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;

  const nextRows = [...rows];
  const [movedRow] = nextRows.splice(sourceIndex, 1);
  const nextTargetIndex = nextRows.findIndex((row) => ptoLinkedRowMatches(row, targetId, targetSignature));
  if (nextTargetIndex < 0) return rows;

  nextRows.splice(position === "after" ? nextTargetIndex + 1 : nextTargetIndex, 0, movedRow);

  return nextRows;
}

export function createEmptyPtoDateRow(
  status: PtoStatus,
  selectedArea: string,
  selectedYear: string,
  id = createId(),
  overrides: Partial<PtoPlanRow> = {},
): PtoPlanRow {
  return {
    id,
    area: overrides.area ?? (selectedArea === "Все участки" ? "" : `Уч_${selectedArea}`),
    location: overrides.location ?? "",
    structure: overrides.structure ?? "",
    unit: normalizePtoUnit(overrides.unit),
    coefficient: Number(overrides.coefficient ?? 0),
    status,
    carryover: Number(overrides.carryover ?? 0),
    carryovers: overrides.carryovers,
    carryoverManualYears: overrides.carryoverManualYears,
    dailyPlans: overrides.dailyPlans ?? {},
    years: uniqueSorted([...(overrides.years ?? []), selectedYear]),
  };
}

export function insertPtoRowAfter(current: PtoPlanRow[], targetRow: PtoPlanRow | undefined, nextRow: PtoPlanRow) {
  if (!targetRow) return [...current, nextRow];

  const targetSignature = ptoLinkedRowSignature(targetRow);
  const targetIndex = current.findIndex((row) => ptoLinkedRowMatches(row, targetRow.id, targetSignature));
  if (targetIndex < 0) return [...current, nextRow];

  return [
    ...current.slice(0, targetIndex + 1),
    nextRow,
    ...current.slice(targetIndex + 1),
  ];
}

export function ptoFieldLogLabel(field: string) {
  const labels: Record<string, string> = {
    area: "Участок",
    location: "Местонахождение",
    structure: "Структура",
    unit: "Ед.",
    coefficient: "Коэфф.",
    carryover: "Остатки",
  };

  return labels[field] ?? field;
}

export function ptoRowFieldDomKey(rowId: string, field: string) {
  return `${rowId}:${field}`;
}

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
  if (!signature) return 0;

  return rows
    .filter((item) => ptoLinkedRowSignature(item) === signature && ptoRowHasYear(item, previousYear))
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

export function normalizePtoPlanRow(row: Partial<PtoPlanRow>): PtoPlanRow {
  const dailyPlans = row.dailyPlans ?? {};
  const storedCarryovers = isRecord(row.carryovers)
    ? Object.fromEntries(
        Object.entries(row.carryovers)
          .map(([year, value]) => [normalizePtoYearValue(year), typeof value === "number" ? value : Number(value)])
          .filter(([year, value]) => year && Number.isFinite(value)),
      )
    : {};
  const carryoverManualYears = uniqueSorted(
    Array.isArray(row.carryoverManualYears)
      ? row.carryoverManualYears
          .map((year) => normalizePtoYearValue(year))
          .filter(Boolean)
      : [],
  );
  const legacyCarryover = Number(row.carryover ?? 0);
  const legacyYear = defaultPtoPlanMonth.slice(0, 4);
  if (!Object.keys(storedCarryovers).length && legacyCarryover !== 0) {
    storedCarryovers[legacyYear] = legacyCarryover;
    carryoverManualYears.push(legacyYear);
  }
  const years = uniqueSorted([
    ...(row.years ?? []),
    ...Object.keys(dailyPlans)
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map((date) => date.slice(0, 4)),
    ...Object.keys(storedCarryovers),
  ]);

  return {
    id: row.id || createId(),
    area: row.area ?? "",
    location: row.location ?? "",
    structure: row.structure ?? "",
    unit: normalizePtoUnit(row.unit),
    coefficient: Number(row.coefficient ?? 0),
    status: row.status ?? "В работе",
    carryover: legacyCarryover,
    carryovers: storedCarryovers,
    carryoverManualYears: uniqueSorted(carryoverManualYears),
    dailyPlans,
    years: years.length ? years : [defaultPtoPlanMonth.slice(0, 4)],
  };
}
