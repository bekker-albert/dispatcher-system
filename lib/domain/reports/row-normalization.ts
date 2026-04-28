import { cleanAreaName } from "../../utils/text";
import { normalizePtoCustomerCode, type PtoPlanRow } from "../pto/date-table";
import type { ReportRow } from "./types";

const defaultReportForm: ReportRow = {
  area: "Аксу",
  name: "",
  unit: "м3",
  dayPlan: 0,
  dayFact: 0,
  dayProductivity: 0,
  dayReason: "",
  monthTotalPlan: 0,
  monthPlan: 0,
  monthFact: 0,
  monthSurveyFact: 0,
  monthOperFact: 0,
  monthProductivity: 0,
  yearPlan: 0,
  yearFact: 0,
  yearSurveyFact: 0,
  yearOperFact: 0,
  yearReason: "",
  annualPlan: 0,
  annualFact: 0,
};

export function reportSurveyCheckpoint(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const checkpointDay = Math.floor(day / 5) * 5 || day;

  return `${year}-${String(month).padStart(2, "0")}-${String(checkpointDay).padStart(2, "0")}`;
}

export function normalizeReportRow(row: Partial<ReportRow>): ReportRow {
  const normalized = {
    ...defaultReportForm,
    ...row,
  };

  return {
    ...normalized,
    dayProductivity: row.dayProductivity ?? normalized.dayFact,
    dayReason: normalized.dayReason ?? "",
    monthTotalPlan: normalized.monthTotalPlan || normalized.monthPlan,
    monthSurveyFact: row.monthSurveyFact ?? normalized.monthFact,
    monthOperFact: row.monthOperFact ?? 0,
    monthProductivity: row.monthProductivity ?? normalized.monthFact,
    yearSurveyFact: row.yearSurveyFact ?? normalized.yearFact,
    yearOperFact: row.yearOperFact ?? 0,
    yearReason: normalized.yearReason ?? "",
    annualPlan: normalized.annualPlan || normalized.yearPlan,
    annualFact: row.annualFact ?? normalized.yearFact,
  };
}

export function createReportRowFromPtoPlan(row: PtoPlanRow): ReportRow {
  return normalizeReportRow({
    area: cleanAreaName(row.area),
    name: row.structure,
    customerCode: normalizePtoCustomerCode(row.customerCode),
    unit: row.unit === "Тонна" ? "тн" : row.unit === "Куб" ? "м3" : row.unit,
    dayReason: "",
    yearReason: "",
  });
}
