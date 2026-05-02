import { findTableColumn } from "../../utils/xlsx";
import { createId } from "../../utils/id";
import { parseDecimalInput } from "../../utils/numbers";
import { uniqueSorted } from "../../utils/text";
import {
  normalizePtoPlanImportArea,
  parsePtoPlanExcelDateHeader,
  parsePtoPlanExcelMonthHeader,
  ptoPlanImportCell,
} from "./excel-headers";
import {
  createEmptyPtoDateRow,
  distributeMonthlyTotal,
  monthDays,
  normalizePtoCustomerCode,
  normalizePtoPlanRow,
  normalizePtoUnit,
  previousPtoYearLabel,
  ptoCustomerPlanRowSignature,
  ptoLinkedRowSignature,
  ptoMonthTotal,
  type PtoDateTableKey,
  type PtoPlanRow,
} from "./date-table";

function ptoImportRowSignature(row: PtoPlanRow, includeCustomerCode: boolean) {
  return includeCustomerCode ? ptoCustomerPlanRowSignature(row) : ptoLinkedRowSignature(row);
}

function mergeImportedDuplicatePtoRows(rows: PtoPlanRow[], includeCustomerCode: boolean) {
  const signatureIndexes = new Map<string, number>();
  const mergedRows: PtoPlanRow[] = [];

  rows.forEach((row) => {
    const signature = ptoImportRowSignature(row, includeCustomerCode);
    if (!signature) {
      mergedRows.push(row);
      return;
    }

    const existingIndex = signatureIndexes.get(signature);
    if (existingIndex === undefined) {
      signatureIndexes.set(signature, mergedRows.length);
      mergedRows.push(row);
      return;
    }

    const existing = mergedRows[existingIndex];
    mergedRows[existingIndex] = normalizePtoPlanRow({
      ...existing,
      location: existing.location || row.location,
      unit: existing.unit || row.unit,
      status: existing.status || row.status,
      customerCode: includeCustomerCode ? existing.customerCode || row.customerCode : "",
      dailyPlans: {
        ...existing.dailyPlans,
        ...row.dailyPlans,
      },
      carryovers: {
        ...(existing.carryovers ?? {}),
        ...(row.carryovers ?? {}),
      },
      carryoverManualYears: uniqueSorted([
        ...(existing.carryoverManualYears ?? []),
        ...(row.carryoverManualYears ?? []),
      ]),
      years: uniqueSorted([...(existing.years ?? []), ...(row.years ?? [])]),
    });
  });

  return mergedRows;
}

export function createPtoPlanRowsFromImportTable(tableRows: string[][], year: string, currentRows: PtoPlanRow[], table: PtoDateTableKey = "plan") {
  const includeCustomerCode = table === "plan";
  const [headers = [], ...rows] = tableRows
    .map((row) => row.map((cell) => String(cell ?? "").trim()))
    .filter((row) => row.some(Boolean));
  if (!headers.length) return [];

  const columns = {
    area: findTableColumn(headers, ["Участок", "Участки"]),
    customerCode: includeCustomerCode ? findTableColumn(headers, ["Заказчик", "Сокр.", "Сокращение", "Код заказчика", "Код"]) : -1,
    structure: findTableColumn(headers, ["Вид работ", "Структура", "Работа"]),
    unit: findTableColumn(headers, ["Ед.", "Ед", "Ед. изм.", "Единица", "Единица измерения"]),
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
      .map((row) => [ptoImportRowSignature(row, includeCustomerCode), row] as const)
      .filter(([signature]) => signature),
  );
  let previousArea = "";

  const importedRows = rows
    .map((row) => {
      const rawArea = ptoPlanImportCell(row, columns.area);
      if (rawArea) previousArea = rawArea;

      const area = normalizePtoPlanImportArea(rawArea || previousArea);
      const customerCode = includeCustomerCode ? normalizePtoCustomerCode(ptoPlanImportCell(row, columns.customerCode)) : "";
      const structure = ptoPlanImportCell(row, columns.structure);
      const unit = normalizePtoUnit(ptoPlanImportCell(row, columns.unit));
      if (!area && !structure) return null;
      if (!structure) return null;

      const signatureProbe = normalizePtoPlanRow({ area, customerCode, structure, unit });
      const existing = currentBySignature.get(ptoImportRowSignature(signatureProbe, includeCustomerCode));
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
        customerCode,
        structure,
        unit,
        status: existing?.status ?? "Новая",
        carryover: existing?.carryover ?? 0,
        carryovers,
        carryoverManualYears,
        dailyPlans,
        years: uniqueSorted([...(existing?.years ?? []), year]),
      });
    })
    .filter((row): row is PtoPlanRow => row !== null);

  return mergeImportedDuplicatePtoRows(importedRows, includeCustomerCode);
}

export function mergeImportedPtoPlanRows(currentRows: PtoPlanRow[], importedRows: PtoPlanRow[], options: { includeCustomerCode?: boolean } = {}) {
  const includeCustomerCode = options.includeCustomerCode === true;
  const importedBySignature = new Map(
    importedRows
      .map((row) => [ptoImportRowSignature(row, includeCustomerCode), row] as const)
      .filter(([signature]) => signature),
  );
  const usedSignatures = new Set<string>();
  const mergedRows = currentRows.map((row) => {
    const signature = ptoImportRowSignature(row, includeCustomerCode);
    const importedRow = signature ? importedBySignature.get(signature) : undefined;
    if (!importedRow) return row;

    usedSignatures.add(signature);
    return importedRow;
  });

  importedRows.forEach((row) => {
    const signature = ptoImportRowSignature(row, includeCustomerCode);
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
      years: row.years,
    }));
  });

  return nextRows;
}
