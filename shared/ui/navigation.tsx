import type { CSSProperties } from "react";

type HeaderSubButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
};

export function HeaderSubButton({ active, onClick, label }: HeaderSubButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={active ? headerSubtabButtonActiveStyle : headerSubtabButtonStyle}
    >
      {label}
    </button>
  );
}

const headerSubtabButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "5px 8px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: "pointer",
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};

const headerSubtabButtonActiveStyle: CSSProperties = {
  ...headerSubtabButtonStyle,
  background: "#0f172a",
  borderColor: "#0f172a",
  color: "#ffffff",
};
