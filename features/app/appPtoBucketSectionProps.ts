import type { ChangeEvent } from "react";

import type { PtoBodyColumn } from "@/lib/domain/pto/bodies";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPerformanceColumn, PtoPerformanceRow } from "@/lib/domain/pto/performance";

export type AppPtoBucketSectionProps = {
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoCycleRows: PtoBucketRow[];
  ptoCycleColumns: PtoBucketColumn[];
  ptoBodyRows: PtoBucketRow[];
  ptoBodyColumns: PtoBodyColumn[];
  ptoPerformanceRows: PtoPerformanceRow[];
  ptoPerformanceColumns: PtoPerformanceColumn[];
  ptoBucketValues: Record<string, number>;
  commitPtoBucketValue: (cellKey: string, draft: string) => void;
  clearPtoBucketCells: (cellKeys: string[]) => void;
  addPtoBucketManualRow: (area: string, structure: string) => boolean;
  deletePtoBucketManualRow: (row: PtoBucketRow) => void;
  exportPtoMatrixToExcel: () => void | Promise<void>;
  importPtoMatrixFromExcel: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
};

type AppPtoBucketSupplementalTables = Pick<
  AppPtoBucketSectionProps,
  | "ptoBucketRows"
  | "ptoBucketColumns"
  | "ptoCycleRows"
  | "ptoCycleColumns"
  | "ptoBodyRows"
  | "ptoBodyColumns"
  | "ptoPerformanceRows"
  | "ptoPerformanceColumns"
  | "commitPtoBucketValue"
  | "clearPtoBucketCells"
  | "addPtoBucketManualRow"
  | "deletePtoBucketManualRow"
  | "exportPtoMatrixToExcel"
  | "importPtoMatrixFromExcel"
>;

export function createAppPtoBucketSectionProps({
  appState,
  ptoSupplementalTables,
}: {
  appState: { ptoBucketValues: Record<string, number> };
  ptoSupplementalTables: AppPtoBucketSupplementalTables;
}): AppPtoBucketSectionProps {
  return {
    ptoBucketRows: ptoSupplementalTables.ptoBucketRows,
    ptoBucketColumns: ptoSupplementalTables.ptoBucketColumns,
    ptoCycleRows: ptoSupplementalTables.ptoCycleRows,
    ptoCycleColumns: ptoSupplementalTables.ptoCycleColumns,
    ptoBodyRows: ptoSupplementalTables.ptoBodyRows,
    ptoBodyColumns: ptoSupplementalTables.ptoBodyColumns,
    ptoPerformanceRows: ptoSupplementalTables.ptoPerformanceRows,
    ptoPerformanceColumns: ptoSupplementalTables.ptoPerformanceColumns,
    ptoBucketValues: appState.ptoBucketValues,
    commitPtoBucketValue: ptoSupplementalTables.commitPtoBucketValue,
    clearPtoBucketCells: ptoSupplementalTables.clearPtoBucketCells,
    addPtoBucketManualRow: ptoSupplementalTables.addPtoBucketManualRow,
    deletePtoBucketManualRow: ptoSupplementalTables.deletePtoBucketManualRow,
    exportPtoMatrixToExcel: ptoSupplementalTables.exportPtoMatrixToExcel,
    importPtoMatrixFromExcel: ptoSupplementalTables.importPtoMatrixFromExcel,
  };
}
