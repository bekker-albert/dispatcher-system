"use client";

import { Trash2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
};

type TopButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  showDelete?: boolean;
  deleteLabel?: string;
  onDelete?: () => void;
};

export function TopButton({
  active,
  onClick,
  label,
  showDelete = false,
  deleteLabel,
  onDelete,
}: TopButtonProps) {
  const buttonStyle = active ? topButtonActiveStyle : topButtonInactiveStyle;
  const groupStyle = active ? topButtonGroupActiveStyle : topButtonGroupInactiveStyle;

  if (showDelete && onDelete) {
    return (
      <span style={groupStyle}>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            onClick();
            event.currentTarget.blur();
          }}
          style={tabInlineLabelButtonStyle}
        >
          {label}
        </button>
        <button
          type="button"
          aria-label={deleteLabel ?? "Удалить вкладку"}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
            event.currentTarget.blur();
          }}
          style={tabInlineDeleteButtonStyle}
          title={deleteLabel ?? "Удалить вкладку"}
        >
          <Trash2 size={13} aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={buttonStyle}
    >
      {label}
    </button>
  );
}

export function IconButton({ label, onClick, children, disabled = false }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        onClick();
        event.currentTarget.blur();
      }}
      style={disabled ? iconButtonDisabledStyle : iconButtonStyle}
      type="button"
    >
      {children}
    </button>
  );
}

export function MiniIconButton({ label, onClick, children, disabled = false }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (disabled) return;
        onClick();
        event.currentTarget.blur();
      }}
      style={disabled ? miniIconButtonDisabledStyle : miniIconButtonStyle}
      type="button"
    >
      {children}
    </button>
  );
}

const tabInlineLabelButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  alignSelf: "stretch",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  font: "inherit",
  fontWeight: "inherit",
  lineHeight: "inherit",
  padding: "7px 2px 7px 10px",
};

const tabInlineDeleteButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  alignSelf: "stretch",
  border: "none",
  borderLeft: "1px solid rgba(255,255,255,0.22)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  display: "inline-grid",
  placeItems: "center",
  padding: "0 8px",
};

const topButtonBaseStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 8,
  padding: "7px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.2,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};

const topButtonActiveStyle: CSSProperties = {
  ...topButtonBaseStyle,
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const topButtonInactiveStyle: CSSProperties = {
  ...topButtonBaseStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const topButtonGroupActiveStyle: CSSProperties = {
  ...topButtonActiveStyle,
  padding: 0,
  cursor: "default",
};

const topButtonGroupInactiveStyle: CSSProperties = {
  ...topButtonInactiveStyle,
  padding: 0,
  cursor: "default",
};

const iconButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  width: 34,
  height: 34,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};

const iconButtonDisabledStyle: CSSProperties = {
  ...iconButtonStyle,
  cursor: "not-allowed",
  opacity: 0.45,
};

const miniIconButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  WebkitTapHighlightColor: "transparent",
  width: 22,
  height: 22,
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  outline: "none",
  boxShadow: "none",
  userSelect: "none",
};

const miniIconButtonDisabledStyle: CSSProperties = {
  ...miniIconButtonStyle,
  cursor: "not-allowed",
  opacity: 0.4,
};
