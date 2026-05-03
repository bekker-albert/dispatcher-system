import type { CSSProperties } from "react";

export const ptoPlanTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
  background: "#ffffff",
};

export const monthToggleStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 4,
  padding: 0,
  cursor: "pointer",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  textAlign: "left",
  whiteSpace: "normal",
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

export const ptoHeaderLabelButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
  overflow: "hidden",
  textOverflow: "clip",
  whiteSpace: "normal",
  overflowWrap: "break-word",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

export const ptoHeaderInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  border: "1px solid #60a5fa",
  borderRadius: 4,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  padding: "2px 4px",
};

export const ptoDateTableLayoutStyle: CSSProperties = {
  height: "100%",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 10,
};

export const ptoDateReadonlyTableLayoutStyle: CSSProperties = {
  height: "100%",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr)",
  gap: 10,
};

export const ptoDateTableScrollStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  paddingLeft: 34,
  paddingRight: 40,
  background: "#ffffff",
  height: "100%",
  minHeight: 0,
};

export const ptoFormulaBarStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
  display: "grid",
  gridTemplateColumns: "minmax(240px, 1fr)",
  gap: 8,
  alignItems: "center",
};

export const ptoFormulaInputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 10px",
  fontFamily: "inherit",
  fontSize: 13,
  fontVariantNumeric: "tabular-nums",
  outline: "none",
};
