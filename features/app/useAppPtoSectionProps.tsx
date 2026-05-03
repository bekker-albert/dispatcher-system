"use client";

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";

import type { PtoSectionProps } from "@/features/pto/PtoSection";
import { usePtoDateTableRenderer } from "@/features/pto/usePtoDateTableRenderer";
import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoPerformanceColumn, PtoPerformanceRow } from "@/lib/domain/pto/performance";

type PtoDateTableRendererOptions = Parameters<typeof usePtoDateTableRenderer>[0];

type UseAppPtoSectionPropsOptions = PtoDateTableRendererOptions & {
  ptoTab: string;
  activePtoSubtabLabel: string;
  activePtoSubtabContent: string;
  isPtoDateTab: boolean;
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoCycleRows: PtoBucketRow[];
  ptoCycleColumns: PtoBucketColumn[];
  ptoBodyRows: PtoBucketRow[];
  ptoBodyColumns: PtoBodyColumn[];
  ptoPerformanceRows: PtoPerformanceRow[];
  ptoPerformanceColumns: PtoPerformanceColumn[];
  ptoBucketValues: Record<string, number>;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  selectPtoArea: (area: string) => void;
  commitPtoBucketValue: (cellKey: string, draft: string) => void;
  clearPtoBucketCells: (cellKeys: string[]) => void;
  addPtoBucketManualRow: (area: string, structure: string) => boolean;
  deletePtoBucketManualRow: (row: PtoBucketRow) => void;
  exportPtoMatrixToExcel: () => void | Promise<void>;
  importPtoMatrixFromExcel: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
};

export function useAppPtoSectionProps({
  ptoTab,
  activePtoSubtabLabel,
  activePtoSubtabContent,
  isPtoDateTab,
  ptoAreaTabs,
  ptoAreaFilter,
  ptoBucketRows,
  ptoBucketColumns,
  ptoCycleRows,
  ptoCycleColumns,
  ptoBodyRows,
  ptoBodyColumns,
  ptoPerformanceRows,
  ptoPerformanceColumns,
  ptoBucketValues,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  selectPtoArea,
  commitPtoBucketValue,
  clearPtoBucketCells,
  addPtoBucketManualRow,
  deletePtoBucketManualRow,
  exportPtoMatrixToExcel,
  importPtoMatrixFromExcel,
  ...dateTableRendererOptions
}: UseAppPtoSectionPropsOptions): PtoSectionProps {
  const renderPtoDateTable = usePtoDateTableRenderer({
    ...dateTableRendererOptions,
    ptoTab,
    ptoAreaFilter,
    ptoAreaTabs,
    selectPtoArea,
  });
  const renderPlanTable = (): ReactNode => renderPtoDateTable(
    ptoPlanRows,
    setPtoPlanRows,
    { showLocation: false, editableMonthTotal: true },
  );
  const renderOperTable = (): ReactNode => renderPtoDateTable(
    ptoOperRows,
    setPtoOperRows,
    { showLocation: false, editableMonthTotal: false },
  );
  const renderSurveyTable = (): ReactNode => renderPtoDateTable(
    ptoSurveyRows,
    setPtoSurveyRows,
    { showLocation: false, editableMonthTotal: false },
  );

  return {
    ptoTab,
    activePtoSubtabLabel,
    activePtoSubtabContent,
    isPtoDateTab,
    ptoAreaTabs,
    ptoAreaFilter,
    onSelectArea: selectPtoArea,
    ptoBucketRows,
    ptoBucketColumns,
    ptoCycleRows,
    ptoCycleColumns,
    ptoBodyRows,
    ptoBodyColumns,
    ptoPerformanceRows,
    ptoPerformanceColumns,
    ptoBucketValues,
    onCommitBucketValue: commitPtoBucketValue,
    onClearBucketCells: clearPtoBucketCells,
    onAddBucketManualRow: addPtoBucketManualRow,
    onDeleteBucketManualRow: deletePtoBucketManualRow,
    onExportPtoMatrixToExcel: exportPtoMatrixToExcel,
    onImportPtoMatrixFromExcel: importPtoMatrixFromExcel,
    renderPlanTable,
    renderOperTable,
    renderSurveyTable,
  };
}
