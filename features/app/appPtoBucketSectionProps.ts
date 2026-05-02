import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

export type AppPtoBucketSectionProps = {
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoBucketValues: Record<string, number>;
  commitPtoBucketValue: (cellKey: string, draft: string) => void;
  clearPtoBucketCells: (cellKeys: string[]) => void;
  addPtoBucketManualRow: (area: string, structure: string) => boolean;
  deletePtoBucketManualRow: (row: PtoBucketRow) => void;
};

type AppPtoBucketSupplementalTables = Pick<
  AppPtoBucketSectionProps,
  | "ptoBucketRows"
  | "ptoBucketColumns"
  | "commitPtoBucketValue"
  | "clearPtoBucketCells"
  | "addPtoBucketManualRow"
  | "deletePtoBucketManualRow"
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
    ptoBucketValues: appState.ptoBucketValues,
    commitPtoBucketValue: ptoSupplementalTables.commitPtoBucketValue,
    clearPtoBucketCells: ptoSupplementalTables.clearPtoBucketCells,
    addPtoBucketManualRow: ptoSupplementalTables.addPtoBucketManualRow,
    deletePtoBucketManualRow: ptoSupplementalTables.deletePtoBucketManualRow,
  };
}
