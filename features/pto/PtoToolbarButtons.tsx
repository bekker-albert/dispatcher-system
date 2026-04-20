import type { CSSProperties, ReactNode } from "react";

type PtoToolbarButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
};

type PtoToolbarIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

export function PtoToolbarButton({ active, onClick, label }: PtoToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={{
        ...ptoToolbarButtonStyle,
        ...(active ? ptoToolbarButtonActiveStyle : null),
      }}
    >
      {label}
    </button>
  );
}

export function PtoToolbarIconButton({ label, onClick, children }: PtoToolbarIconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={ptoToolbarIconButtonStyle}
      type="button"
    >
      {children}
    </button>
  );
}

const ptoToolbarButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 8,
  padding: "4px 7px",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.15,
  cursor: "pointer",
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};

const ptoToolbarButtonActiveStyle: CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const ptoToolbarIconButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  width: 26,
  height: 26,
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};
