"use client";

import { useMemo } from "react";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { createPtoDatabaseState } from "@/features/pto/ptoPersistenceModel";

type PtoDatabaseStateOptions = {
  ptoManualYears: string[];
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoBucketValues: Record<string, number>;
  ptoBucketManualRows: PtoBucketRow[];
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  expandedPtoMonths: Record<string, boolean>;
  reportColumnWidths: Record<string, number>;
  reportReasons: Record<string, string>;
  ptoColumnWidths: Record<string, number>;
  ptoRowHeights: Record<string, number>;
  ptoHeaderLabels: Record<string, string>;
};

export function usePtoDatabaseState({
  ptoManualYears,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoBucketValues,
  ptoBucketManualRows,
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  expandedPtoMonths,
  reportColumnWidths,
  reportReasons,
  ptoColumnWidths,
  ptoRowHeights,
  ptoHeaderLabels,
}: PtoDatabaseStateOptions) {
  return useMemo(() => createPtoDatabaseState({
    manualYears: ptoManualYears,
    planRows: ptoPlanRows,
    operRows: ptoOperRows,
    surveyRows: ptoSurveyRows,
    bucketValues: ptoBucketValues,
    bucketRows: ptoBucketManualRows,
    uiState: {
      ptoTab,
      ptoPlanYear,
      ptoAreaFilter,
      expandedPtoMonths,
      reportColumnWidths,
      reportReasons,
      ptoColumnWidths,
      ptoRowHeights,
      ptoHeaderLabels,
    },
  }), [
    expandedPtoMonths,
    ptoAreaFilter,
    ptoBucketManualRows,
    ptoBucketValues,
    ptoColumnWidths,
    ptoHeaderLabels,
    ptoManualYears,
    ptoOperRows,
    ptoPlanRows,
    ptoPlanYear,
    ptoRowHeights,
    ptoSurveyRows,
    ptoTab,
    reportColumnWidths,
    reportReasons,
  ]);
}
