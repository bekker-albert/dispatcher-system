import { findTableColumn, type XlsxColumnOption } from "../../utils/xlsx";
import { createId } from "../../utils/id";
import { parseDecimalInput } from "../../utils/numbers";
import { cleanAreaName, uniqueSorted } from "../../utils/text";
import {
  createEmptyPtoDateRow,
  distributeMonthlyTotal,
  monthDays,
  normalizePtoPlanRow,
  normalizePtoUnit,
  previousPtoYearLabel,
  ptoAreaMatches,
  ptoLinkedRowSignature,
  ptoMonthTotal,
  ptoRowHasYear,
  ptoStoredCarryover,
  ptoYearTotalWithCarryover,
  yearMonths,
  type PtoDateTableKey,
  type PtoPlanRow,
} from "./date-table";

export type PtoDateExcelMeta = {
  table: PtoDateTableKey;
  label: string;
  slug: string;
  section: string;
};

export function ptoDateTableMeta(tab: string): PtoDateExcelMeta {
  if (tab === "oper") {
    return { table: "oper", label: "Оперучет", slug: "operuchet", section: "ПТО: Оперучет" };
  }

  if (tab === "survey") {
    return { table: "survey", label: "Замер", slug: "zamer", section: "ПТО: Замер" };
  }

  return { table: "plan", label: "План", slug: "plan", section: "ПТО: План" };
}

export function ptoDateExportFileName(meta: Pick<PtoDateExcelMeta, "slug">, year: string, areaFilter: string) {
  const areaPart = areaFilter === "Все участки" ? "vse-uchastki" : cleanAreaName(areaFilter);
  const safeAreaPart = areaPart.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "-") || meta.slug;

  return `pto-${meta.slug}-${year}-${safeAreaPart}.xlsx`;
}

function ptoExcelIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  return valid ? date.toISOString().slice(0, 10) : "";
}

function ptoPlanExcelDateLabel(date: string) {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;
}

function ptoPlanExcelMonthLabel(month: string) {
  return `Итого ${month}`;
}

function parsePtoPlanExcelDateHeader(value: string, selectedYear: string) {
  const text = value.trim();
  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return ptoExcelIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const fullDateMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (fullDateMatch) {
    return ptoExcelIsoDate(Number(fullDateMatch[3]), Number(fullDateMatch[2]), Number(fullDateMatch[1]));
  }

  const shortDateMatch = text.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (shortDateMatch) {
    return ptoExcelIsoDate(Number(selectedYear), Number(shortDateMatch[2]), Number(shortDateMatch[1]));
  }

  const serial = Number(text);
  if (/^\d+(\.\d+)?$/.test(text) && serial > 30000 && serial < 80000) {
    const date = new Date(Math.round((serial - 25569) * 86400000));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  return "";
}

function parsePtoPlanExcelMonthHeader(value: string, selectedYear: string) {
  const text = value.trim().toLowerCase();
  if (!text || (!text.includes("итого") && !text.includes("месяц"))) return "";

  const isoMatch = text.match(/(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const month = Number(isoMatch[2]);
    return month >= 1 && month <= 12 ? `${isoMatch[1]}-${String(month).padStart(2, "0")}` : "";
  }

  const monthYearMatch = text.match(/(\d{1,2})[./-](\d{4})/);
  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    return month >= 1 && month <= 12 ? `${monthYearMatch[2]}-${String(month).padStart(2, "0")}` : "";
  }

  const selectedYearMonthMatch = text.match(/(?:^|\D)(\d{1,2})(?:\D|$)/);
  if (selectedYearMonthMatch) {
    const month = Number(selectedYearMonthMatch[1]);
    return month >= 1 && month <= 12 ? `${selectedYear}-${String(month).padStart(2, "0")}` : "";
  }

  return "";
}

function normalizePtoPlanImportArea(value: string) {
  const area = cleanAreaName(value.trim()).trim();
  if (!area) return "";
  return /^уч[._\s-]*/i.test(value.trim()) ? value.trim() : `Уч_${area}`;
}

function ptoPlanImportCell(row: string[], column: number) {
  return column >= 0 ? row[column]?.trim() ?? "" : "";
}

function ptoPlanExportCell(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}

export function createPtoPlanExportRows(rows: PtoPlanRow[], year: string, areaFilterValue: string) {
  const months = yearMonths(year);
  const headers = [
    "Участок",
    "Вид работ",
    "Ед.",
    "Коэфф.",
    `Остатки ${previousPtoYearLabel(year)}`,
    "Итого год",
    ...months.flatMap((month) => [
      ptoPlanExcelMonthLabel(month),
      ...monthDays(month).map(ptoPlanExcelDateLabel),
    ]),
  ];
  const exportRows = rows
    .filter((row) => ptoAreaMatches(row.area, areaFilterValue) && ptoRowHasYear(row, year))
    .map((row) => [
      cleanAreaName(row.area),
      row.structure,
      normalizePtoUnit(row.unit),
      ptoPlanExportCell(row.coefficient),
      ptoPlanExportCell(ptoStoredCarryover(row, year)),
      ptoPlanExportCell(ptoYearTotalWithCarryover(row, year, rows)),
      ...months.flatMap((month) => {
        const days = monthDays(month);
        const monthHasValue = days.some((day) => row.dailyPlans[day] !== undefined);

        return [
          monthHasValue ? ptoPlanExportCell(ptoMonthTotal(row, month)) : "",
          ...days.map((day) => ptoPlanExportCell(row.dailyPlans[day])),
        ];
      }),
    ]);

  return [headers, ...exportRows];
}

export function createPtoPlanExportColumns(year: string) {
  const columns: XlsxColumnOption[] = [
    { width: 14 },
    { width: 42 },
    { width: 7 },
    { width: 10 },
    { width: 15 },
    { width: 15 },
  ];

  yearMonths(year).forEach((month) => {
    columns.push({ width: 13, collapsed: true });
    monthDays(month).forEach(() => {
      columns.push({ width: 10, hidden: true, outlineLevel: 1 });
    });
  });

  return columns;
}

export function createPtoPlanRowsFromImportTable(tableRows: string[][], year: string, currentRows: PtoPlanRow[]) {
  const [headers = [], ...rows] = tableRows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (!headers.length) return [];

  const columns = {
    area: findTableColumn(headers, ["Участок", "Участки"]),
    structure: findTableColumn(headers, ["Вид работ", "Структура", "Работа"]),
    unit: findTableColumn(headers, ["Ед.", "Ед", "Ед. изм.", "Единица", "Единица измерения"]),
    coefficient: findTableColumn(headers, ["Коэфф.", "Коэфф", "Коэффициент"]),
    carryover: findTableColumn(headers, [`Остатки ${previousPtoYearLabel(year)}`, "Остатки", "Остаток"]),
  };

  if (columns.area < 0 || columns.structure < 0) {
    throw new Error("В файле должны быть столбцы «Участок» и «Вид работ».");
  }

  const dateColumns = headers
    .map((header, index) => ({ index, date: parsePtoPlanExcelDateHeader(header, year) }))
    .filter((column) => column.date.startsWith(`${year}-`));
  const monthColumns = headers
    .map((header, index) => ({ index, month: parsePtoPlanExcelMonthHeader(header, year) }))
    .filter((column) => column.month.startsWith(`${year}-`));
  const currentBySignature = new Map(
    currentRows
      .map((row) => [ptoLinkedRowSignature(row), row] as const)
      .filter(([signature]) => signature),
  );
  let previousArea = "";

  return rows
    .map((row) => {
      const rawArea = ptoPlanImportCell(row, columns.area);
      if (rawArea) previousArea = rawArea;

      const area = normalizePtoPlanImportArea(rawArea || previousArea);
      const structure = ptoPlanImportCell(row, columns.structure);
      const unit = normalizePtoUnit(ptoPlanImportCell(row, columns.unit));
      if (!area && !structure) return null;
      if (!structure) return null;

      const signatureProbe = normalizePtoPlanRow({ area, structure, unit });
      const existing = currentBySignature.get(ptoLinkedRowSignature(signatureProbe));
      const dailyPlans = Object.fromEntries(
        Object.entries(existing?.dailyPlans ?? {}).filter(([date]) => !date.startsWith(`${year}-`)),
      );
      const importedDayDates = new Set<string>();

      dateColumns.forEach(({ index, date }) => {
        const parsed = parseDecimalInput(ptoPlanImportCell(row, index));
        if (parsed === null) return;

        dailyPlans[date] = parsed;
        importedDayDates.add(date);
      });

      monthColumns.forEach(({ index, month }) => {
        const parsed = parseDecimalInput(ptoPlanImportCell(row, index));
        if (parsed === null) return;

        const days = monthDays(month);
        const hasImportedDays = days.some((day) => importedDayDates.has(day));
        const existingMonthTotal = existing ? ptoMonthTotal(existing, month) : 0;
        const importedDaysStillMatchExisting = Boolean(existing) && days.every((day) => {
          const importedHasValue = importedDayDates.has(day);
          const existingHasValue = existing?.dailyPlans[day] !== undefined;
          if (!importedHasValue && !existingHasValue) return true;
          if (importedHasValue !== existingHasValue) return false;

          return Math.abs((dailyPlans[day] ?? 0) - (existing?.dailyPlans[day] ?? 0)) < 0.000001;
        });
        const monthTotalChanged = Math.abs(parsed - existingMonthTotal) > 0.000001;
        if (hasImportedDays && (!monthTotalChanged || !importedDaysStillMatchExisting)) return;

        days.forEach((day) => {
          delete dailyPlans[day];
        });
        Object.assign(dailyPlans, distributeMonthlyTotal(parsed, days));
      });

      const carryover = parseDecimalInput(ptoPlanImportCell(row, columns.carryover));
      const coefficient = parseDecimalInput(ptoPlanImportCell(row, columns.coefficient));
      const carryovers = {
        ...(existing?.carryovers ?? {}),
        ...(carryover === null ? {} : { [year]: carryover }),
      };
      const carryoverManualYears = carryover === null
        ? existing?.carryoverManualYears
        : uniqueSorted([...(existing?.carryoverManualYears ?? []), year]);

      return normalizePtoPlanRow({
        id: existing?.id ?? createId(),
        area,
        location: existing?.location ?? "",
        structure,
        unit,
        coefficient: coefficient ?? existing?.coefficient ?? 0,
        status: existing?.status ?? "Новая",
        carryover: existing?.carryover ?? 0,
        carryovers,
        carryoverManualYears,
        dailyPlans,
        years: uniqueSorted([...(existing?.years ?? []), year]),
      });
    })
    .filter((row): row is PtoPlanRow => row !== null);
}

export function mergeImportedPtoPlanRows(currentRows: PtoPlanRow[], importedRows: PtoPlanRow[]) {
  const importedBySignature = new Map(
    importedRows
      .map((row) => [ptoLinkedRowSignature(row), row] as const)
      .filter(([signature]) => signature),
  );
  const usedSignatures = new Set<string>();
  const mergedRows = currentRows.map((row) => {
    const signature = ptoLinkedRowSignature(row);
    const importedRow = signature ? importedBySignature.get(signature) : undefined;
    if (!importedRow) return row;

    usedSignatures.add(signature);
    return importedRow;
  });

  importedRows.forEach((row) => {
    const signature = ptoLinkedRowSignature(row);
    if (!signature || usedSignatures.has(signature)) return;

    usedSignatures.add(signature);
    mergedRows.push(row);
  });

  return mergedRows;
}

export function ensureImportedRowsInLinkedPtoTable(currentRows: PtoPlanRow[], importedRows: PtoPlanRow[], selectedYear: string) {
  const signatures = new Set(currentRows.map(ptoLinkedRowSignature).filter(Boolean));
  const nextRows = [...currentRows];

  importedRows.forEach((row) => {
    const signature = ptoLinkedRowSignature(row);
    if (!signature || signatures.has(signature)) return;

    signatures.add(signature);
    nextRows.push(createEmptyPtoDateRow("Новая", "Все участки", selectedYear, row.id, {
      area: row.area,
      location: row.location,
      structure: row.structure,
      unit: row.unit,
      coefficient: row.coefficient,
      years: row.years,
    }));
  });

  return nextRows;
}
