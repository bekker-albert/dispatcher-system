import { cleanAreaName } from "../../utils/text";

function ptoExcelIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;

  return valid ? date.toISOString().slice(0, 10) : "";
}

export function ptoPlanExcelDateLabel(date: string) {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;
}

export function ptoPlanExcelMonthLabel(month: string) {
  return `Итого ${month}`;
}

export function parsePtoPlanExcelDateHeader(value: string, selectedYear: string) {
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

export function parsePtoPlanExcelMonthHeader(value: string, selectedYear: string) {
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

export function normalizePtoPlanImportArea(value: string) {
  const area = cleanAreaName(value.trim()).trim();
  if (!area) return "";
  return /^уч[._\s-]*/i.test(value.trim()) ? value.trim() : `Уч_${area}`;
}

export function ptoPlanImportCell(row: string[], column: number) {
  return column >= 0 ? row[column]?.trim() ?? "" : "";
}

export function ptoPlanExportCell(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : "";
}
