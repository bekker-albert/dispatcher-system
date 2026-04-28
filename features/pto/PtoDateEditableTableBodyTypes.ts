import type { usePtoDateFormulaController } from "@/features/pto/ptoDateFormulaController";
import type { PtoDateTableContainerProps } from "@/features/pto/ptoDateTableTypes";
import type { createPtoDateTableViewModel } from "@/features/pto/ptoDateTableViewModel";
import type { createPtoDateVirtualRowsViewModel } from "@/features/pto/ptoDateVirtualRowsViewModel";
import type { usePtoDraftRowController } from "@/features/pto/usePtoDraftRowController";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type PtoDateTableViewModel = ReturnType<typeof createPtoDateTableViewModel>;
type PtoDateVirtualRowsViewModel = ReturnType<typeof createPtoDateVirtualRowsViewModel>;
type PtoDateFormulaController = ReturnType<typeof usePtoDateFormulaController>;
type PtoDraftRowController = ReturnType<typeof usePtoDraftRowController>;

export type PtoDateEditableTableBodyProps = Pick<
  PtoDateTableContainerProps,
  | "beginPtoRowTextDraft"
  | "cancelPtoRowTextDraft"
  | "commitPtoRowTextDraft"
  | "draggedPtoRowId"
  | "getPtoDropPosition"
  | "getPtoRowTextDraft"
  | "hoveredPtoAddRowId"
  | "moveLinkedPtoDateRow"
  | "ptoDateEditing"
  | "ptoDateOptionMaps"
  | "ptoDraftRowFields"
  | "ptoDropTarget"
  | "ptoFormulaDraft"
  | "ptoRowHeights"
  | "ptoSelectionDraggingRef"
  | "ptoTab"
  | "removeLinkedPtoDateRow"
  | "reportDate"
  | "requestPtoDatabaseSave"
  | "setDraggedPtoRowId"
  | "setHoveredPtoAddRowId"
  | "setPtoDropTarget"
  | "setRows"
  | "startPtoRowResize"
  | "updatePtoDateRow"
  | "updatePtoRowTextDraft"
> & Pick<
  PtoDateTableViewModel,
  | "carryoverHeader"
  | "displayPtoMonthGroups"
  | "editableMonthTotal"
  | "filteredRows"
  | "getEffectiveCarryover"
  | "getRowDateTotals"
  | "showCustomerCode"
  | "showLocation"
  | "tableMinWidth"
> & Pick<
  PtoDateVirtualRowsViewModel,
  | "bottomSpacerHeight"
  | "renderedRows"
  | "topSpacerHeight"
  | "virtualStartIndex"
> & Pick<
  PtoDraftRowController,
  | "addRowAfter"
  | "addRowFromDraft"
  | "handleDraftKeyDown"
  | "updateDraftField"
> & Pick<
  PtoDateFormulaController,
  | "commitInlineFormulaEdit"
  | "formulaCellActive"
  | "formulaCellDomKey"
  | "formulaCellEditing"
  | "formulaRowEditing"
  | "formulaCellSelected"
  | "formulaCellsByRowId"
  | "handleFormulaCellKeyDown"
  | "handleFormulaCellMouseDown"
  | "handleFormulaCellMouseEnter"
  | "selectFormulaCell"
  | "selectFormulaRange"
  | "startInlineFormulaEdit"
  | "updateFormulaValue"
> & {
  tableSpacerColSpan: number;
};

export type PtoDateEditableTableRowProps = Omit<
  PtoDateEditableTableBodyProps,
  | "addRowFromDraft"
  | "bottomSpacerHeight"
  | "handleDraftKeyDown"
  | "ptoDraftRowFields"
  | "renderedRows"
  | "tableSpacerColSpan"
  | "topSpacerHeight"
  | "updateDraftField"
  | "virtualStartIndex"
> & {
  row: PtoPlanRow;
  rowIndex: number;
};
