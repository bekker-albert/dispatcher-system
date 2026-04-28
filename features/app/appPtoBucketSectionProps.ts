import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { UseAppPtoScreenPropsArgs } from "@/features/app/appPtoScreenPropsTypes";

export type AppPtoBucketSectionProps = {
  ptoBucketRows: PtoBucketRow[];
  ptoBucketColumns: PtoBucketColumn[];
  ptoBucketValues: Record<string, number>;
  commitPtoBucketValue: (cellKey: string, draft: string) => void;
  clearPtoBucketCells: (cellKeys: string[]) => void;
  addPtoBucketManualRow: (area: string, structure: string) => boolean;
  deletePtoBucketManualRow: (row: PtoBucketRow) => void;
};

export function createAppPtoBucketSectionProps({
  appState,
  ptoSupplementalTables,
}: Pick<UseAppPtoScreenPropsArgs, "appState" | "ptoSupplementalTables">): AppPtoBucketSectionProps {
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
