import type { PtoStatus } from "../pto/date-table";

export type ReportRow = {
  area: string;
  name: string;
  displayKey?: string;
  customerCode?: string;
  unit: string;
  dayPlan: number;
  dayFact: number;
  dayProductivity: number;
  dayReason: string;
  monthTotalPlan: number;
  monthPlan: number;
  monthFact: number;
  monthSurveyFact: number;
  monthOperFact: number;
  monthProductivity: number;
  yearPlan: number;
  yearFact: number;
  yearSurveyFact: number;
  yearOperFact: number;
  yearReason: string;
  annualPlan: number;
  annualFact: number;
};

export type ReportSummaryRowConfig = {
  id: string;
  label: string;
  unit: string;
  area: string;
  rowKeys: string[];
};

export type ReportCustomerConfig = {
  id: string;
  label: string;
  ptoCode: string;
  visible: boolean;
  autoShowRows: boolean;
  rowKeys: string[];
  hiddenRowKeys: string[];
  rowLabels: Record<string, string>;
  summaryRows: ReportSummaryRowConfig[];
  areaOrder: string[];
  workOrder: Record<string, string[]>;
};

export type ReportPtoDateStatus = {
  plan: PtoStatus;
  oper: PtoStatus;
  survey: PtoStatus;
  planHasDateValue: boolean;
  operHasDateValue: boolean;
  surveyHasDateValue: boolean;
};
