import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { calculatePtoVirtualRows, type PtoVirtualViewport } from "@/lib/domain/pto/virtualization";

type PtoDateVirtualRowsViewModelOptions = {
  editing: boolean;
  rows: PtoPlanRow[];
  rowHeights: Record<string, number>;
  table: string;
  viewport: PtoVirtualViewport;
};

export function createPtoDateVirtualRowsViewModel({
  editing,
  rows,
  rowHeights,
  table,
  viewport,
}: PtoDateVirtualRowsViewModelOptions) {
  const virtualRows = editing
    ? calculatePtoVirtualRows(rows, rowHeights, table, viewport)
    : null;

  const rowOffsets = virtualRows?.rowOffsets ?? [];
  const virtualRowsTotalHeight = virtualRows?.totalHeight ?? 0;

  return {
    renderedRows: virtualRows?.renderedRows ?? rows,
    filteredRowHeights: virtualRows?.rowHeights ?? [],
    rowOffsetAt: (index: number) => rowOffsets[index] ?? virtualRowsTotalHeight,
    virtualStartIndex: virtualRows?.startIndex ?? 0,
    topSpacerHeight: virtualRows?.topSpacerHeight ?? 0,
    bottomSpacerHeight: virtualRows?.bottomSpacerHeight ?? 0,
    virtualRowsTotalHeight,
  };
}
