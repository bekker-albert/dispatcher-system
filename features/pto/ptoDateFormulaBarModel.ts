import type { PtoFormulaCell } from "@/features/pto/ptoDateFormulaTypes";

type PtoDateFormulaBarProps = {
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

type CreatePtoDateFormulaBarPropsOptions = {
  activeFormulaCell: PtoFormulaCell | null;
  formulaInputDisabled: boolean;
  ptoFormulaDraft: string;
  commitFormulaBarEdit: () => void;
  updateFormulaValue: (value: string) => void;
};

export function createPtoDateFormulaBarProps({
  activeFormulaCell,
  formulaInputDisabled,
  ptoFormulaDraft,
  commitFormulaBarEdit,
  updateFormulaValue,
}: CreatePtoDateFormulaBarPropsOptions): PtoDateFormulaBarProps {
  return {
    value: activeFormulaCell ? ptoFormulaDraft : "",
    disabled: formulaInputDisabled,
    onValueChange: updateFormulaValue,
    onBlur: commitFormulaBarEdit,
  };
}
