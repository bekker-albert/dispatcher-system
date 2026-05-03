import type { CSSProperties } from "react";

export const ptoPlanThStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "normal",
  position: "relative",
  overflow: "hidden",
};

export const ptoHeaderContentStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  whiteSpace: "normal",
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
  textAlign: "inherit",
};

export const ptoColumnResizeHandleStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: -3,
  width: 7,
  height: "100%",
  cursor: "col-resize",
  zIndex: 12,
};

export const ptoPlanTdStyle: CSSProperties = {
  position: "relative",
  padding: 3,
  border: "1px solid #e2e8f0",
  verticalAlign: "middle",
  background: "inherit",
};

export const ptoActiveFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  zIndex: 3,
};

export const ptoSelectedFormulaCellStyle: CSSProperties = {
  boxShadow: "inset 0 0 0 2px #2563eb",
  background: "#eff6ff",
  zIndex: 2,
};

export const ptoEditingFormulaCellStyle: CSSProperties = {
  background: "#f1f5f9",
};
