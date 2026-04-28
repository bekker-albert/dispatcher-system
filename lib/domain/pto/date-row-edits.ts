import {
  defaultPtoPlanMonth,
  type PtoPlanRow,
} from "./date-table";
import { parseDecimalValue } from "./formatting";
import { uniqueSorted } from "../../utils/text";

export type PtoDateRowEditableField = keyof Omit<PtoPlanRow, "id" | "dailyPlans">;

export const ptoSharedEditableFields: PtoDateRowEditableField[] = ["area", "location", "structure", "unit"];

export function parsePtoEditableFieldValue(field: PtoDateRowEditableField, value: string) {
  return field === "carryover" ? parseDecimalValue(value) : value;
}

export function updatePtoCarryoverForYear(row: PtoPlanRow, year: string, value: number): PtoPlanRow {
  return {
    ...row,
    carryover: value,
    carryovers: {
      ...(row.carryovers ?? {}),
      [year]: value,
    },
    carryoverManualYears: uniqueSorted([...(row.carryoverManualYears ?? []), year]),
    years: uniqueSorted([...(row.years ?? []), year]),
  };
}

export function clearPtoCarryoverForYear(row: PtoPlanRow, year: string): PtoPlanRow {
  const carryovers = { ...(row.carryovers ?? {}) };
  delete carryovers[year];

  return {
    ...row,
    carryover: year === defaultPtoPlanMonth.slice(0, 4) ? 0 : row.carryover,
    carryovers,
    carryoverManualYears: (row.carryoverManualYears ?? []).filter((rowYear) => rowYear !== year),
  };
}

export function updatePtoDayValue(row: PtoPlanRow, day: string, value: number | null): PtoPlanRow {
  const dailyPlans = { ...row.dailyPlans };
  const year = day.slice(0, 4);

  if (value === null) {
    delete dailyPlans[day];
  } else {
    dailyPlans[day] = value;
  }

  return {
    ...row,
    dailyPlans,
    years: uniqueSorted([...(row.years ?? []), year]),
  };
}

export function updatePtoMonthValues(
  row: PtoPlanRow,
  days: string[],
  values: Record<string, number>,
): PtoPlanRow {
  const nextDailyPlans = { ...row.dailyPlans };
  days.forEach((day) => {
    delete nextDailyPlans[day];
  });
  Object.assign(nextDailyPlans, values);

  return {
    ...row,
    dailyPlans: nextDailyPlans,
    years: days[0] ? uniqueSorted([...(row.years ?? []), days[0].slice(0, 4)]) : row.years,
  };
}
