import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaModel";

type PtoFormulaFocusCell = Pick<PtoFormulaCell, "rowId" | "kind" | "day" | "month">;

type FocusPtoFormulaCellOptions = {
  cell: PtoFormulaFocusCell;
  formulaCellDomKey: (cell: PtoFormulaFocusCell) => string;
  scrollFormulaCellIntoView: (cell: PtoFormulaFocusCell) => void;
};

export function focusPtoFormulaCell({
  cell,
  formulaCellDomKey,
  scrollFormulaCellIntoView,
}: FocusPtoFormulaCellOptions) {
  const focusTarget = () => {
    const target = document.querySelector<HTMLInputElement>(`[data-pto-cell-key="${formulaCellDomKey(cell)}"]`);
    if (!target) return false;

    target.focus();
    return true;
  };

  window.requestAnimationFrame(() => {
    const focused = focusTarget();
    if (focused) return;

    scrollFormulaCellIntoView(cell);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusTarget);
    });
  });
}
