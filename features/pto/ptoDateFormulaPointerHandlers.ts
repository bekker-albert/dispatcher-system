import type { MouseEvent } from "react";
import type { PtoDateFormulaControllerOptions } from "@/features/pto/ptoDateFormulaControllerTypes";
import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";

type PtoDateFormulaPointerHandlersOptions = Pick<
  PtoDateFormulaControllerOptions,
  "ptoDateEditing" | "ptoSelectionDraggingRef"
> & {
  selectFormulaCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  selectFormulaRange: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
  toggleFormulaCell: (cell: PtoFormulaCellWithoutScope, value: number | undefined) => void;
};

export function createPtoDateFormulaPointerHandlers({
  ptoDateEditing,
  ptoSelectionDraggingRef,
  selectFormulaCell,
  selectFormulaRange,
  toggleFormulaCell,
}: PtoDateFormulaPointerHandlersOptions) {
  const handleFormulaCellMouseDown = (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => {
    if (!ptoDateEditing) return;
    if (event.button !== 0 || isEditing) return;

    ptoSelectionDraggingRef.current = true;
    if (event.ctrlKey || event.metaKey) {
      toggleFormulaCell(cell, value);
    } else if (event.shiftKey) {
      selectFormulaRange(cell, value);
    } else {
      selectFormulaCell(cell, value);
    }
  };

  const handleFormulaCellMouseEnter = (
    event: MouseEvent<HTMLElement>,
    cell: PtoFormulaCellWithoutScope,
    value: number | undefined,
    isEditing: boolean,
  ) => {
    if (!ptoDateEditing) return;
    if (!ptoSelectionDraggingRef.current || event.buttons !== 1 || event.ctrlKey || event.metaKey || isEditing) return;
    selectFormulaRange(cell, value);
  };

  return {
    handleFormulaCellMouseDown,
    handleFormulaCellMouseEnter,
  };
}
