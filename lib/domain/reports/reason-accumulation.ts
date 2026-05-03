import { nextDate, type PtoPlanRow } from "../pto/date-table";
import { reportYearFact } from "./facts";
import {
  buildReportPtoIndex,
  carryoverTotal,
  reportIndexKey,
  type ReportPtoIndex,
  type ReportPtoIndexEntry,
} from "./pto-index";
import type { ReportRow } from "./types";

const reportFactEpsilon = 0.000001;

type ReportPtoDailyCursor = {
  index: number;
  values: Array<{ date: string; value: number }>;
};

function createReportPtoDailyCursor(entry: ReportPtoIndexEntry | undefined, startDate: string): ReportPtoDailyCursor {
  const values = entry?.prefixTotals.map(({ date }) => ({ date, value: entry.dailyTotals.get(date) ?? 0 })) ?? [];
  let index = 0;

  while (index < values.length && values[index].date < startDate) {
    index += 1;
  }

  return { index, values };
}

function consumeReportPtoDailyCursor(cursor: ReportPtoDailyCursor, endDate: string) {
  let value = 0;

  while (cursor.index < cursor.values.length && cursor.values[cursor.index].date <= endDate) {
    value += cursor.values[cursor.index].value;
    cursor.index += 1;
  }

  return value;
}

function reportYearFactAtAccumulationDate(
  state: {
    fallbackYearFact: number;
    hasFactEntry: boolean;
    hasSurveyFact: boolean;
    operCarryover: number;
    operCursor: ReportPtoDailyCursor;
    operSinceSurveyFact: number;
    operTotal: number;
    surveyCarryover: number;
    surveyCursor: ReportPtoDailyCursor;
    surveyFactAtLatest: number;
    surveyTotal: number;
  },
  date: string,
) {
  const operDailyValue = consumeReportPtoDailyCursor(state.operCursor, date);
  const surveyDailyValue = consumeReportPtoDailyCursor(state.surveyCursor, date);

  state.operTotal += operDailyValue;
  state.surveyTotal += surveyDailyValue;

  if (Math.abs(surveyDailyValue) >= reportFactEpsilon) {
    state.hasSurveyFact = true;
    state.surveyFactAtLatest = state.surveyCarryover + state.surveyTotal;
    state.operSinceSurveyFact = 0;
  } else if (state.hasSurveyFact) {
    state.operSinceSurveyFact += operDailyValue;
  }

  if (state.hasSurveyFact) {
    return state.surveyFactAtLatest + state.operSinceSurveyFact;
  }

  if (state.surveyCarryover !== 0) {
    return state.surveyCarryover + state.operTotal;
  }

  if (state.hasFactEntry) {
    return state.operCarryover + state.operTotal;
  }

  return state.fallbackYearFact;
}

function reportReasonAccumulationStartDateFromEntries(
  row: ReportRow,
  reportDateValue: string,
  planEntry: ReportPtoIndexEntry | undefined,
  surveyEntry: ReportPtoIndexEntry | undefined,
  operEntry: ReportPtoIndexEntry | undefined,
) {
  const yearStart = `${reportDateValue.slice(0, 4)}-01-01`;
  const year = reportDateValue.slice(0, 4);
  let startDate = yearStart;
  let yearPlan = planEntry ? carryoverTotal(planEntry, year) : row.yearPlan;
  const planCursor = createReportPtoDailyCursor(planEntry, yearStart);
  const factState = {
    fallbackYearFact: reportYearFact(row),
    hasFactEntry: Boolean(surveyEntry || operEntry),
    hasSurveyFact: false,
    operCarryover: carryoverTotal(operEntry, year),
    operCursor: createReportPtoDailyCursor(operEntry, yearStart),
    operSinceSurveyFact: 0,
    operTotal: 0,
    surveyCarryover: carryoverTotal(surveyEntry, year),
    surveyCursor: createReportPtoDailyCursor(surveyEntry, yearStart),
    surveyFactAtLatest: 0,
    surveyTotal: 0,
  };

  for (let date = yearStart; date <= reportDateValue; date = nextDate(date)) {
    if (planEntry) {
      yearPlan += consumeReportPtoDailyCursor(planCursor, date);
    }

    const yearFact = reportYearFactAtAccumulationDate(factState, date);
    const yearDelta = yearFact - yearPlan;

    if (yearDelta >= 0) {
      startDate = nextDate(date);
    }
  }

  return startDate;
}

export function reportReasonAccumulationStartDateFromIndexes(
  row: ReportRow,
  reportDateValue: string,
  planIndex: ReportPtoIndex,
  surveyIndex: ReportPtoIndex,
  operIndex: ReportPtoIndex,
) {
  return reportReasonAccumulationStartDateFromEntries(
    row,
    reportDateValue,
    planIndex.get(reportIndexKey(row, true)),
    surveyIndex.get(reportIndexKey(row, false)),
    operIndex.get(reportIndexKey(row, false)),
  );
}

export function reportReasonAccumulationStartDate(
  row: ReportRow,
  reportDateValue: string,
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
) {
  return reportReasonAccumulationStartDateFromIndexes(
    row,
    reportDateValue,
    buildReportPtoIndex(planRows, { includeCustomerCode: true }),
    buildReportPtoIndex(surveyRows),
    buildReportPtoIndex(operRows),
  );
}
