import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";
import type { PtoBucketCell, PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";

export type PtoBucketsDraftRowValue = {
  area: string;
  structure: string;
};

export type PtoBucketsCellHandlers = {
  onCellBlur: (cellKey: string) => void;
  onCellDraftChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCellKeyDown: (
    event: KeyboardEvent<HTMLElement>,
    cell: PtoBucketCell,
    value: number | undefined,
    cellKey: string,
    isEditing: boolean,
  ) => void;
  onCellMouseDown: (event: MouseEvent<HTMLElement>, cell: PtoBucketCell) => void;
  onSelectCell: (cell: PtoBucketCell) => void;
  onStartEdit: (cell: PtoBucketCell, value: number | undefined) => void;
};

export type PtoBucketsVirtualRowsView = {
  rows: PtoBucketRow[];
  topSpacerHeight: number;
  bottomSpacerHeight: number;
};

export type PtoBucketsVirtualColumnsView<TColumn extends PtoBucketColumn = PtoBucketColumn> = {
  columns: TColumn[];
  leftSpacerWidth: number;
  rightSpacerWidth: number;
};
