import type { PtoPlanRow } from "../../lib/domain/pto/date-table";
import {
  calculatePtoVirtualRowsFromLayout,
  createPtoVirtualRowsLayout,
  type PtoVirtualRowsLayout,
  type PtoVirtualViewport,
} from "../../lib/domain/pto/virtualization";

type PtoDateVirtualRowsViewModelOptions = {
  rows: PtoPlanRow[];
  rowHeights: Record<string, number>;
  table: string;
  viewport: PtoVirtualViewport;
};

export function createPtoDateVirtualRowsViewModel({
  rows,
  rowHeights,
  table,
  layout,
  viewport,
}: Partial<PtoDateVirtualRowsViewModelOptions> & {
  layout?: PtoVirtualRowsLayout<PtoPlanRow>;
  viewport: PtoVirtualViewport;
}) {
  const virtualRowsLayout = layout ?? createPtoVirtualRowsLayout(rows ?? [], rowHeights ?? {}, table ?? "");
  const virtualRows = calculatePtoVirtualRowsFromLayout(virtualRowsLayout, viewport);

  const rowOffsets = virtualRows.rowOffsets;
  const virtualRowsTotalHeight = virtualRows.totalHeight;

  return {
    renderedRows: virtualRows.renderedRows,
    filteredRowHeights: virtualRows.rowHeights,
    rowOffsetAt: (index: number) => rowOffsets[index] ?? virtualRowsTotalHeight,
    virtualStartIndex: virtualRows.startIndex,
    topSpacerHeight: virtualRows.topSpacerHeight,
    bottomSpacerHeight: virtualRows.bottomSpacerHeight,
    virtualRowsTotalHeight,
  };
}

export function createPtoDateVirtualRowsLayoutModel({
  rows,
  rowHeights,
  table,
}: Omit<PtoDateVirtualRowsViewModelOptions, "viewport">) {
  return createPtoVirtualRowsLayout(rows, rowHeights, table);
}
