import { parseDecimalInput } from "../../utils/numbers";

export { parseDecimalInput } from "../../utils/numbers";

const ptoCellNumberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

const ptoFormulaNumberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 6,
  useGrouping: false,
});

const bucketNumberFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

const monthNameFormatter = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
});

export function parseDecimalValue(value: string | number) {
  return parseDecimalInput(value) ?? 0;
}

export function formatPtoCellNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return ptoCellNumberFormatter.format(value);
}

export function formatPtoFormulaNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return ptoFormulaNumberFormatter.format(value);
}

export function formatBucketNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";

  return bucketNumberFormatter.format(value);
}

export function formatMonthName(month: string) {
  return monthNameFormatter.format(new Date(`${month}-01T00:00:00`));
}
