"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { PtoSectionProps } from "@/features/pto/PtoSection";
import { usePtoDateTableRenderer } from "@/features/pto/usePtoDateTableRenderer";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

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
    ptoBucketValues,
    onCommitBucketValue: commitPtoBucketValue,
    onClearBucketCells: clearPtoBucketCells,
    onAddBucketManualRow: addPtoBucketManualRow,
    onDeleteBucketManualRow: deletePtoBucketManualRow,
    renderPlanTable,
    renderOperTable,
    renderSurveyTable,
  };
}
