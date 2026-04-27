import {
  ptoFormulaBarStyle,
  ptoFormulaInputStyle,
} from "@/features/pto/ptoDateTableStyles";

type PtoFormulaBarProps = {
  value: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
  onBlur: () => void;
};

export function PtoFormulaBar({ value, disabled, onValueChange, onBlur }: PtoFormulaBarProps) {
  return (
    <div style={ptoFormulaBarStyle}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder="\u0412\u044b\u0431\u0435\u0440\u0438 \u0447\u0438\u0441\u043b\u043e\u0432\u0443\u044e \u044f\u0447\u0435\u0439\u043a\u0443"
        style={ptoFormulaInputStyle}
      />
    </div>
  );
}
