import { delta, formatNumber, formatPercent, formatReportWorkName, reportRowDisplayKey } from "../../lib/domain/reports/display";
import { reportAnnualFact, reportMonthFact, reportYearFact } from "../../lib/domain/reports/facts";
import { reportReasonEmptyOverride, reportReasonEntryKey, reportYearReasonOverrideKey } from "../../lib/domain/reports/reasons";
import type { ReportRow } from "../../lib/domain/reports/types";

type ReportCellTone = "good" | "bad" | "warn";

type ReportMetricViewModel = {
  note: string;
  value: string;
};

type ReportDeltaViewModel = {
  text: string;
  tone: ReportCellTone;
  value: number;
};

type ReportReasonViewModel = {
  key: string;
  missing: boolean;
  showEditor: boolean;
  text: string;
  tone?: ReportCellTone;
};

export type ReportRowDisplayViewModel = {
  annualFact: string;
  annualPlan: string;
  annualRemaining: ReportDeltaViewModel;
  area: string;
  areaRowSpan: number;
  dayDelta: ReportDeltaViewModel;
  dayFact: string;
  dayPlan: string;
  dayProductivity: ReportMetricViewModel;
  dayReason: ReportReasonViewModel;
  monthDelta: ReportDeltaViewModel;
  monthFact: ReportMetricViewModel;
  monthPlan: string;
  monthProductivity: ReportMetricViewModel;
  monthTotalPlan: string;
  rowClassName?: string;
  rowKey: string;
  showAreaCell: boolean;
  unit: string;
  workName: string;
  yearDelta: ReportDeltaViewModel;
  yearFact: ReportMetricViewModel;
  yearPlan: string;
  yearReason: ReportReasonViewModel;
};

export type CreateReportRowDisplayViewModelInput = {
  dayReasonText?: string;
  groupRowCount: number;
  reportBodyRowCount: number;
  reportDate: string;
  reportLastPrintPageRows: number;
  reportReasons: Record<string, string>;
  reportShouldFillPrintRows: boolean;
  row: ReportRow;
  rowIndexInGroup: number;
  rowPrintIndex: number;
  yearReasonText?: string;
};

function createDeltaViewModel(plan: number, fact: number): ReportDeltaViewModel {
  const value = delta(plan, fact);

  return {
    text: formatNumber(value),
    tone: value < 0 ? "bad" : "good",
    value,
  };
}

function createReasonViewModel(params: {
  fallbackText: string;
  reasonKey: string;
  reasonText?: string;
  reasons: Record<string, string>;
  showEditor: boolean;
}): ReportReasonViewModel {
  const rawText = params.reasonText ?? params.reasons[params.reasonKey] ?? params.fallbackText;
  const text = params.showEditor && rawText !== reportReasonEmptyOverride ? rawText : "";
  const missing = params.showEditor && text.trim() === "";

  return {
    key: params.reasonKey,
    missing,
    showEditor: params.showEditor,
    text,
    tone: missing ? "warn" : undefined,
  };
}

export function createReportRowDisplayViewModel({
  dayReasonText,
  groupRowCount,
  reportBodyRowCount,
  reportDate,
  reportLastPrintPageRows,
  reportReasons,
  reportShouldFillPrintRows,
  row,
  rowIndexInGroup,
  rowPrintIndex,
  yearReasonText,
}: CreateReportRowDisplayViewModelInput): ReportRowDisplayViewModel {
  const monthFactValue = reportMonthFact(row);
  const yearFactValue = reportYearFact(row);
  const annualFactValue = reportAnnualFact(row);
  const dayDelta = createDeltaViewModel(row.dayPlan, row.dayFact);
  const monthDelta = createDeltaViewModel(row.monthPlan, monthFactValue);
  const yearDelta = createDeltaViewModel(row.yearPlan, yearFactValue);
  const annualRemaining = createDeltaViewModel(row.annualPlan, annualFactValue);
  const rowKey = reportRowDisplayKey(row);
  const dayReasonKey = reportReasonEntryKey(reportDate, rowKey);
  const yearReasonKey = reportYearReasonOverrideKey(reportDate, rowKey);
  const showAreaCell = rowIndexInGroup === 0;

  return {
    annualFact: formatNumber(annualFactValue),
    annualPlan: formatNumber(row.annualPlan),
    annualRemaining,
    area: row.area,
    areaRowSpan: groupRowCount,
    dayDelta,
    dayFact: formatNumber(row.dayFact),
    dayPlan: formatNumber(row.dayPlan),
    dayProductivity: {
      note: formatPercent(row.dayFact, row.dayPlan),
      value: formatNumber(row.dayProductivity || row.dayFact),
    },
    dayReason: createReasonViewModel({
      fallbackText: row.dayReason,
      reasonKey: dayReasonKey,
      reasonText: dayReasonText,
      reasons: reportReasons,
      showEditor: dayDelta.value < 0,
    }),
    monthDelta,
    monthFact: {
      note: `марк ${formatNumber(row.monthSurveyFact)}`,
      value: formatNumber(monthFactValue),
    },
    monthPlan: formatNumber(row.monthPlan),
    monthProductivity: {
      note: formatPercent(monthFactValue, row.monthPlan),
      value: formatNumber(row.monthProductivity || monthFactValue),
    },
    monthTotalPlan: formatNumber(row.monthTotalPlan),
    rowClassName: reportShouldFillPrintRows && rowPrintIndex >= reportBodyRowCount - reportLastPrintPageRows
      ? "report-print-fill-row"
      : undefined,
    rowKey,
    showAreaCell,
    unit: row.unit,
    workName: formatReportWorkName(row.name),
    yearDelta,
    yearFact: {
      note: `марк ${formatNumber(row.yearSurveyFact)}`,
      value: formatNumber(yearFactValue),
    },
    yearPlan: formatNumber(row.yearPlan),
    yearReason: createReasonViewModel({
      fallbackText: row.yearReason,
      reasonKey: yearReasonKey,
      reasonText: yearReasonText,
      reasons: reportReasons,
      showEditor: yearDelta.value < 0,
    }),
  };
}
