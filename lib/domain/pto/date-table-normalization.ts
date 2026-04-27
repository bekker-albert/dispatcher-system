import { createId } from "../../utils/id";
import { uniqueSorted } from "../../utils/text";
import { defaultPtoPlanMonth, ptoCustomerCodeOptions, ptoUnitOptions, type PtoPlanRow } from "./date-table-types";
import { normalizePtoYearValue } from "./date-table-years";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizePtoUnit(value: string | undefined) {
  const text = (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

  if (text === "\u043c2" || text === "\u043c\u00b2" || text.includes("\u043a\u0432")) return "\u043c2";
  if (text === "\u043c3" || text === "\u043c\u00b3" || text.includes("\u043a\u0443\u0431")) return "\u043c3";
  if (text === "\u0442" || text === "\u0442\u043d" || text.includes("\u0442\u043e\u043d")) return "\u0442\u043d";
  if ((ptoUnitOptions as readonly string[]).includes(text)) return text;
  return "\u043c3";
}

export function normalizePtoCustomerCode(value: string | undefined) {
  const text = (value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!text) return "";

  const matched = ptoCustomerCodeOptions.find((option) => option.code === text);
  return matched?.code ?? text.slice(0, 12);
}

export function ptoCustomerCodeLabel(code: string | undefined) {
  const normalizedCode = normalizePtoCustomerCode(code);
  const matched = ptoCustomerCodeOptions.find((option) => option.code === normalizedCode);
  return matched ? `${matched.code} - ${matched.label}` : normalizedCode;
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
    customerCode: normalizePtoCustomerCode(row.customerCode),
    unit: normalizePtoUnit(row.unit),
    status: row.status ?? "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435",
    carryover: legacyCarryover,
    carryovers: storedCarryovers,
    carryoverManualYears: uniqueSorted(carryoverManualYears),
    dailyPlans,
    years: years.length ? years : [defaultPtoPlanMonth.slice(0, 4)],
  };
}
