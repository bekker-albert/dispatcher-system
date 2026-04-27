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
        placeholder="Р’С‹Р±РµСЂРё С‡РёСЃР»РѕРІСѓСЋ СЏС‡РµР№РєСѓ"
        style={ptoFormulaInputStyle}
      />
    </div>
  );
}
