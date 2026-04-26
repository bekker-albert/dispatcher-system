import { useMemo } from "react";

import {
  buildReportPtoIndex,
  createReportRowFromPtoPlan,
  deriveReportRowFromPtoIndex,
  reportReasonAccumulationStartDateFromIndexes,
} from "@/lib/domain/reports/calculation";
import { delta, reportRowKey } from "@/lib/domain/reports/display";
import { reportYearFact } from "@/lib/domain/reports/facts";
import { reportReasonEntryKey, reportYearReasonValue } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { cleanAreaName } from "@/lib/utils/text";

type UseReportRowsModelOptions = {
  needsReportRows: boolean;
  needsReportIndexes: boolean;
  needsAutoReportRows: boolean;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  reportDate: string;
  reportReasons: Record<string, string>;
};

export function useReportRowsModel({
  needsReportRows,
  needsReportIndexes,
  needsAutoReportRows,
  deferredPtoPlanRows,
  deferredPtoSurveyRows,
  deferredPtoOperRows,
  reportDate,
  reportReasons,
}: UseReportRowsModelOptions) {
  const reportBaseRows = useMemo(() => {
    if (!needsReportRows) return [];

    const rowsByKey = new Map<string, ReportRow>();
    const plannedBaseKeys = new Set(
      deferredPtoPlanRows
        .filter((row) => row.structure.trim())
        .map((row) => reportRowKey({ area: cleanAreaName(row.area), name: row.structure })),
    );

    deferredPtoPlanRows.forEach((row) => {
      if (!row.structure.trim()) return;

      const reportRow = createReportRowFromPtoPlan(row);
      const key = reportRowKey(reportRow);
      if (!rowsByKey.has(key)) rowsByKey.set(key, reportRow);
    });

    [...deferredPtoSurveyRows, ...deferredPtoOperRows].forEach((row) => {
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
  }, [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, needsReportRows]);

  const reportPtoIndexes = useMemo(() => (
    needsReportIndexes
      ? {
          plan: buildReportPtoIndex(deferredPtoPlanRows, { includeCustomerCode: true }),
          survey: buildReportPtoIndex(deferredPtoSurveyRows),
          oper: buildReportPtoIndex(deferredPtoOperRows),
        }
      : null
  ), [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, needsReportIndexes]);

  const derivedReportRows = useMemo(() => (
    needsAutoReportRows && reportPtoIndexes ? reportBaseRows.map((row) => {
      const derivedRow = deriveReportRowFromPtoIndex(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper);
      const rowKey = reportRowKey(row);
      const dayReason = reportReasons[reportReasonEntryKey(reportDate, rowKey)] ?? derivedRow.dayReason;
      const yearDelta = delta(derivedRow.yearPlan, reportYearFact(derivedRow));
      const accumulationStartDate = yearDelta < 0
        ? reportReasonAccumulationStartDateFromIndexes(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper)
        : reportDate;
      const fallbackYearReason = accumulationStartDate === `${reportDate.slice(0, 4)}-01-01`
        ? derivedRow.yearReason
        : "";
      const yearReason = yearDelta < 0
        ? reportYearReasonValue(reportReasons, rowKey, reportDate, fallbackYearReason, accumulationStartDate)
        : "";

      return {
        ...derivedRow,
        dayReason,
        yearReason,
      };
    }) : []
  ), [needsAutoReportRows, reportBaseRows, reportDate, reportPtoIndexes, reportReasons]);

  return {
    reportBaseRows,
    reportPtoIndexes,
    derivedReportRows,
  };
}
