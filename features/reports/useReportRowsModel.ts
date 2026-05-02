import { useMemo, useRef } from "react";

import {
  buildReportPtoIndex,
  createReportRowFromPtoPlan,
  deriveReportRowFromPtoIndex,
  reportReasonAccumulationStartDateFromIndexes,
} from "@/lib/domain/reports/calculation";
import { delta, reportRowKey } from "@/lib/domain/reports/display";
import { reportYearFact } from "@/lib/domain/reports/facts";
import { createReportReasonIndex, reportReasonEntryKey, reportYearReasonValueFromIndex } from "@/lib/domain/reports/reasons";
import type { ReportRow } from "@/lib/domain/reports/types";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { cleanAreaName } from "@/lib/utils/text";

type UseReportRowsModelOptions = {
  needsReportRows: boolean;
  needsReportIndexes: boolean;
  needsAutoReportRows: boolean;
  needsReportReasons: boolean;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  reportDate: string;
  reportReasons: Record<string, string>;
};

type CachedDerivedReportRow = {
  base: ReportRow;
  output: ReportRow;
};

export function useReportRowsModel({
  needsReportRows,
  needsReportIndexes,
  needsAutoReportRows,
  needsReportReasons,
  deferredPtoPlanRows,
  deferredPtoSurveyRows,
  deferredPtoOperRows,
  reportDate,
  reportReasons,
}: UseReportRowsModelOptions) {
  const derivedReportRowsCacheRef = useRef(new Map<string, CachedDerivedReportRow>());

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

  const calculatedReportRows = useMemo(() => (
    needsAutoReportRows && reportPtoIndexes ? reportBaseRows.map((row) => (
      deriveReportRowFromPtoIndex(row, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper)
    )) : []
  ), [needsAutoReportRows, reportBaseRows, reportDate, reportPtoIndexes]);

  const reasonAccumulationStartDateByRowKey = useMemo(() => {
    if (!needsAutoReportRows || !needsReportReasons || !reportPtoIndexes) return new Map<string, string>();

    return new Map(calculatedReportRows.flatMap((derivedRow) => {
      const rowKey = reportRowKey(derivedRow);
      const yearDelta = delta(derivedRow.yearPlan, reportYearFact(derivedRow));
      return yearDelta < 0
        ? [[rowKey, reportReasonAccumulationStartDateFromIndexes(derivedRow, reportDate, reportPtoIndexes.plan, reportPtoIndexes.survey, reportPtoIndexes.oper)] as const]
        : [];
    }));
  }, [calculatedReportRows, needsAutoReportRows, needsReportReasons, reportDate, reportPtoIndexes]);

  const derivedReportRows = useMemo(() => {
    if (!needsAutoReportRows || calculatedReportRows.length === 0) {
      derivedReportRowsCacheRef.current = new Map();
      return [];
    }

    if (!needsReportReasons) return calculatedReportRows;

    let reasonIndex: ReturnType<typeof createReportReasonIndex> | null = null;
    const previousCache = derivedReportRowsCacheRef.current;
    const nextCache = new Map<string, CachedDerivedReportRow>();

    const rows = calculatedReportRows.map((derivedRow) => {
      const rowKey = reportRowKey(derivedRow);
      const dayReason = reportReasons[reportReasonEntryKey(reportDate, rowKey)] ?? derivedRow.dayReason;
      const yearDelta = delta(derivedRow.yearPlan, reportYearFact(derivedRow));
      const accumulationStartDate = reasonAccumulationStartDateByRowKey.get(rowKey) ?? reportDate;
      const fallbackYearReason = yearDelta < 0 && accumulationStartDate === `${reportDate.slice(0, 4)}-01-01`
        ? derivedRow.yearReason
        : "";
      const yearReason = yearDelta < 0
        ? reportYearReasonValueFromIndex(
            reportReasons,
            reasonIndex ??= createReportReasonIndex(reportReasons),
            rowKey,
            reportDate,
            fallbackYearReason,
            accumulationStartDate,
          )
        : "";
      const previous = previousCache.get(rowKey);

      if (
        previous?.base === derivedRow
        && previous.output.dayReason === dayReason
        && previous.output.yearReason === yearReason
      ) {
        nextCache.set(rowKey, previous);
        return previous.output;
      }

      const output = {
        ...derivedRow,
        dayReason,
        yearReason,
      };

      nextCache.set(rowKey, { base: derivedRow, output });
      return output;
    });

    derivedReportRowsCacheRef.current = nextCache;
    return rows;
  }, [calculatedReportRows, needsAutoReportRows, needsReportReasons, reasonAccumulationStartDateByRowKey, reportDate, reportReasons]);

  return {
    reportBaseRows,
    reportPtoIndexes,
    derivedReportRows,
  };
}
