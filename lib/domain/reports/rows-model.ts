import type { PtoPlanRow } from "../pto/date-table";
import {
  buildReportPtoIndex,
  type ReportPtoIndex,
} from "./pto-index";
import { createReportRowFromPtoPlan } from "./row-normalization";
import { deriveReportRowFromPtoIndex } from "./pto-facts";
import { reportRowKey } from "./display";
import type { ReportRow } from "./types";
import { cleanAreaName } from "../../utils/text";

export type ReportPtoIndexes = {
  plan: ReportPtoIndex;
  survey: ReportPtoIndex;
  oper: ReportPtoIndex;
};

export function createReportBaseRows(
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
) {
  const rowsByKey = new Map<string, ReportRow>();
  const plannedBaseKeys = new Set(
    planRows
      .filter((row) => row.structure.trim())
      .map((row) => reportRowKey({ area: cleanAreaName(row.area), name: row.structure })),
  );

  planRows.forEach((row) => {
    if (!row.structure.trim()) return;

    const reportRow = createReportRowFromPtoPlan(row);
    const key = reportRowKey(reportRow);
    if (!rowsByKey.has(key)) rowsByKey.set(key, reportRow);
  });

  [...surveyRows, ...operRows].forEach((row) => {
    if (!row.structure.trim()) return;

    const baseKey = reportRowKey({ area: cleanAreaName(row.area), name: row.structure });
    if (plannedBaseKeys.has(baseKey)) return;

    const reportRow = createReportRowFromPtoPlan(row);
    const key = reportRowKey(reportRow);
    if (!rowsByKey.has(key)) rowsByKey.set(key, reportRow);
  });

  return Array.from(rowsByKey.values()).sort((a, b) => (
    a.area.localeCompare(b.area, "ru") || a.name.localeCompare(b.name, "ru")
  ));
}

export function createReportPtoIndexes(
  planRows: PtoPlanRow[],
  surveyRows: PtoPlanRow[],
  operRows: PtoPlanRow[],
): ReportPtoIndexes {
  return {
    plan: buildReportPtoIndex(planRows, { includeCustomerCode: true }),
    survey: buildReportPtoIndex(surveyRows),
    oper: buildReportPtoIndex(operRows),
  };
}

export function deriveReportRowsFromPtoIndexes(
  rows: ReportRow[],
  reportDate: string,
  indexes: ReportPtoIndexes,
) {
  return rows.map((row) => (
    deriveReportRowFromPtoIndex(row, reportDate, indexes.plan, indexes.survey, indexes.oper)
  ));
}
