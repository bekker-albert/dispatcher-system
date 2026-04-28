import { nextDate, type PtoPlanRow } from "../pto/date-table";
import { buildReportPtoIndex, carryoverTotal, exactDateTotal, indexedSourceValue, latestFactDateInRange, rangeTotal, reportIndexKey, type ReportPtoIndex, type ReportPtoIndexEntry } from "./pto-index";
import type { ReportRow } from "./types";
export {
  reportReasonAccumulationStartDate,
  reportReasonAccumulationStartDateFromIndexes,
} from "./reason-accumulation";

export function surveyOperFactThroughDate(
  surveyEntry: ReportPtoIndexEntry | undefined,
  operEntry: ReportPtoIndexEntry | undefined,
  startDate: string,
  endDate: string,
  options: { carryoverYear?: string } = {},
) {
  const surveyDate = latestFactDateInRange(surveyEntry, startDate, endDate);
  const surveyCarryover = options.carryoverYear ? carryoverTotal(surveyEntry, options.carryoverYear) : 0;
  const operCarryover = options.carryoverYear ? carryoverTotal(operEntry, options.carryoverYear) : 0;

  if (surveyDate) {
    return {
      matched: true,
      surveyFact: surveyCarryover + rangeTotal(surveyEntry, startDate, surveyDate),
      operFact: rangeTotal(operEntry, nextDate(surveyDate), endDate),
    };
  }

  if (surveyCarryover !== 0) {
    return {
      matched: true,
      surveyFact: surveyCarryover,
      operFact: rangeTotal(operEntry, startDate, endDate),
    };
  }

  return {
    matched: Boolean(surveyEntry || operEntry),
    surveyFact: 0,
    operFact: operCarryover + rangeTotal(operEntry, startDate, endDate),
  };
}

export function deriveReportRowFromPto(
  row: ReportRow,
  reportDateValue: string,
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
): ReportRow {
  return deriveReportRowFromPtoIndex(
    row,
    reportDateValue,
    buildReportPtoIndex(planRows, { includeCustomerCode: true }),
    buildReportPtoIndex(surveyRows),
    buildReportPtoIndex(operRows),
  );
}

export function deriveReportRowFromPtoIndex(
  row: ReportRow,
  reportDateValue: string,
  planIndex: ReportPtoIndex,
  surveyIndex: ReportPtoIndex,
  operIndex: ReportPtoIndex,
): ReportRow {
  const year = reportDateValue.slice(0, 4);
  const month = reportDateValue.slice(0, 7);
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;
  const planEntry = planIndex.get(reportIndexKey(row, true));
  const surveyEntry = surveyIndex.get(reportIndexKey(row, false));
  const operEntry = operIndex.get(reportIndexKey(row, false));

  const dayPlan = indexedSourceValue(planEntry, exactDateTotal(planEntry, reportDateValue), row.dayPlan);
  const monthTotalPlan = indexedSourceValue(planEntry, rangeTotal(planEntry, monthStart, monthEnd), row.monthTotalPlan);
  const monthPlan = indexedSourceValue(planEntry, rangeTotal(planEntry, monthStart, reportDateValue), row.monthPlan);
  const yearPlan = indexedSourceValue(planEntry, carryoverTotal(planEntry, year) + rangeTotal(planEntry, yearStart, reportDateValue), row.yearPlan);
  const annualPlan = indexedSourceValue(planEntry, carryoverTotal(planEntry, year) + rangeTotal(planEntry, yearStart, yearEnd), row.annualPlan);

  const dayOperFact = exactDateTotal(operEntry, reportDateValue);
  const daySurveyFact = exactDateTotal(surveyEntry, reportDateValue);
  const dayFact = dayOperFact || daySurveyFact || (operEntry || surveyEntry ? 0 : row.dayFact);

  const monthFactSource = surveyOperFactThroughDate(surveyEntry, operEntry, monthStart, reportDateValue);
  const yearFactSource = surveyOperFactThroughDate(surveyEntry, operEntry, yearStart, reportDateValue, { carryoverYear: year });
  const monthSurveyFact = monthFactSource.matched ? monthFactSource.surveyFact : row.monthSurveyFact;
  const monthOperFact = monthFactSource.matched ? monthFactSource.operFact : row.monthOperFact;
  const yearSurveyFact = yearFactSource.matched ? yearFactSource.surveyFact : row.yearSurveyFact;
  const yearOperFact = yearFactSource.matched ? yearFactSource.operFact : row.yearOperFact;

  const monthFact = monthFactSource.matched ? monthSurveyFact + monthOperFact : row.monthFact;
  const yearFact = yearFactSource.matched ? yearSurveyFact + yearOperFact : row.yearFact;

  return {
    ...row,
    dayPlan,
    dayFact,
    dayProductivity: row.dayProductivity || dayFact,
    monthTotalPlan,
    monthPlan,
    monthSurveyFact,
    monthOperFact,
    monthFact,
    monthProductivity: row.monthProductivity || monthFact,
    yearPlan,
    yearSurveyFact,
    yearOperFact,
    yearFact,
    annualPlan,
    annualFact: yearFact,
  };
}
