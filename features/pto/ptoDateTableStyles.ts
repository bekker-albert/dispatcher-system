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
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "left",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

export const ptoHeaderLabelButtonStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

export const ptoHeaderInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
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

export const ptoToolbarStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "8px 10px",
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto auto",
  gap: 8,
  alignItems: "end",
};

export const ptoToolbarBlockStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  alignContent: "start",
};

export const ptoToolbarRowStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  flexWrap: "wrap",
  alignItems: "center",
};

export const ptoToolbarLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

export const ptoYearDialogStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  padding: 7,
  display: "flex",
  gap: 6,
  alignItems: "end",
  flexWrap: "wrap",
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

export const ptoAreaCellStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

export const ptoRowToolsStyle: CSSProperties = {
  position: "absolute",
  left: -32,
  top: "50%",
  transform: "translateY(-50%)",
  width: 28,
  height: 30,
  display: "grid",
  placeItems: "center",
};

export const dragHandleStyle: CSSProperties = {
  width: 18,
  height: 24,
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "grab",
  fontFamily: "inherit",
  display: "inline-grid",
  placeItems: "center",
  padding: 0,
  flex: "0 0 auto",
};

export const ptoRowDeleteButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 24,
  height: 26,
  border: "none",
  background: "transparent",
  color: "#991b1b",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  opacity: 0.72,
  zIndex: 6,
};

export const ptoInlineAddRowButtonStyle: CSSProperties = {
  position: "absolute",
  left: -27,
  bottom: -10,
  width: 18,
  height: 18,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "16px",
  opacity: 0.28,
  padding: 0,
  transition: "opacity 120ms ease, background 120ms ease, border-color 120ms ease",
  zIndex: 6,
};

export const ptoInlineAddRowButtonHoverStyle: CSSProperties = {
  opacity: 1,
  background: "#dbeafe",
  borderColor: "#60a5fa",
};

export const ptoDropIndicatorStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  height: 3,
  background: "#2563eb",
  borderRadius: 999,
  pointerEvents: "none",
  zIndex: 3,
};

export const ptoRowResizeHandleStyle: CSSProperties = {
  position: "absolute",
  left: -24,
  right: 0,
  bottom: -4,
  height: 8,
  cursor: "row-resize",
  zIndex: 8,
};

export const dragHandleDotsStyle: CSSProperties = {
  width: 6,
  display: "grid",
  gap: 3,
  justifyItems: "center",
};

export const dragHandleDotStyle: CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: "#64748b",
};

export const ptoDraftRowStyle: CSSProperties = {
  background: "#f8fafc",
  color: "#64748b",
};

export const ptoDraftAddButtonStyle: CSSProperties = {
  position: "absolute",
  left: -28,
  top: "50%",
  transform: "translateY(-50%)",
  width: 20,
  height: 20,
  border: "1px solid #bfdbfe",
  borderRadius: 4,
  background: "#ffffff",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: "18px",
  opacity: 0.75,
  padding: 0,
};

export const ptoDraftInputStyle: CSSProperties = {
  background: "transparent",
  borderColor: "transparent",
  color: "#64748b",
  fontStyle: "italic",
};

export const ptoDraftStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 29,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "6px 8px",
};

export const ptoDraftCellHintStyle: CSSProperties = {
  display: "block",
  minHeight: 29,
};

export const ptoPlanInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 0,
  padding: "3px 4px",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  fontVariantNumeric: "tabular-nums",
  background: "transparent",
};

export const ptoCompactNumberInputStyle: CSSProperties = {
  minWidth: 0,
  cursor: "cell",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoStatusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: 25,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 4,
  padding: "3px 6px",
  fontWeight: 800,
  lineHeight: 1.15,
  textAlign: "center",
  whiteSpace: "normal",
};

export const ptoReadonlyTotalStyle: CSSProperties = {
  width: "100%",
  minWidth: 92,
  border: "1px solid transparent",
  borderRadius: 0,
  background: "transparent",
  color: "#0f172a",
  cursor: "cell",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.25,
  padding: "3px 4px",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoReadonlyCellTextStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  padding: "4px 5px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const ptoReadonlyCellNumberStyle: CSSProperties = {
  ...ptoReadonlyCellTextStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  overflow: "visible",
  textOverflow: "clip",
};

export const ptoPlanDayInputStyle: CSSProperties = {
  ...ptoPlanInputStyle,
  minWidth: 82,
  textAlign: "center",
};
