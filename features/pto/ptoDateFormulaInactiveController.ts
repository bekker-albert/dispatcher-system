import type { PtoFormulaCellWithoutScope } from "@/features/pto/ptoDateFormulaTypes";

const noopFormulaCellHandler = () => undefined;

export function createInactivePtoDateFormulaController() {
  return {
    activeFormulaCell: null,
    activeFormulaValue: undefined,
    formulaCellActive: () => false,
    formulaCellDomKey: () => "",
    formulaCellEditing: () => false,
    formulaCellSelected: () => false,
    formulaCellsByRowId: new Map<string, PtoFormulaCellWithoutScope[]>(),
    formulaInputDisabled: true,
    handleFormulaCellKeyDown: noopFormulaCellHandler,
    handleFormulaCellMouseDown: noopFormulaCellHandler,
    handleFormulaCellMouseEnter: noopFormulaCellHandler,
    selectFormulaCell: noopFormulaCellHandler,
    selectFormulaRange: noopFormulaCellHandler,
    startInlineFormulaEdit: noopFormulaCellHandler,
    commitFormulaBarEdit: noopFormulaCellHandler,
    commitInlineFormulaEdit: noopFormulaCellHandler,
    updateFormulaDraft: noopFormulaCellHandler,
    updateFormulaValue: noopFormulaCellHandler,
  };
}
