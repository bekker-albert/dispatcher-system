import type { CSSProperties } from "react";

export const blockStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.25,
  outline: "none",
  padding: "12px 14px",
};

export const dispatchSummaryHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

export const dispatchSummaryStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 8,
  marginBottom: 12,
};

export const dispatchInnerTabsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#d8dee8",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 3,
  marginBottom: 10,
};

export const dispatchInnerTabButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: 6,
  background: "transparent",
  color: "#475569",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "7px 10px",
};

export const dispatchInnerTabActiveButtonStyle: CSSProperties = {
  ...dispatchInnerTabButtonStyle,
  background: "#ffffff",
  color: "#0f4c81",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
};

export const dispatchPlanFactPanelStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#d8dee8",
  borderRadius: 8,
  background: "#ffffff",
  marginBottom: 10,
  overflow: "hidden",
};

export const dispatchPlanFactHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 10px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 800,
};

export const dispatchPlanFactTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
};

export const dispatchPlanFactCellStyle: CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  padding: "7px 8px",
  textAlign: "right",
  color: "#334155",
};

export const dispatchPlanFactStructureCellStyle: CSSProperties = {
  ...dispatchPlanFactCellStyle,
  textAlign: "left",
  fontWeight: 700,
  color: "#0f172a",
};

export const dispatchPlanFactEmptyStyle: CSSProperties = {
  padding: "12px 10px",
  color: "#64748b",
  fontSize: 12,
};

export const dispatchSummaryStatCardStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "9px 10px",
  display: "grid",
  gap: 4,
  fontSize: 12,
};

export const dispatchSummaryToolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) minmax(150px, 220px) minmax(240px, 360px) auto auto",
  gap: 8,
  alignItems: "end",
  marginBottom: 10,
};

export const dispatchSummaryToolbarDailyStyle: CSSProperties = {
  ...dispatchSummaryToolbarStyle,
  gridTemplateColumns: "minmax(220px, 1fr) minmax(150px, 220px) minmax(220px, 1fr) minmax(260px, 1fr)",
};

export const dispatchSummaryToolbarCompactStyle: CSSProperties = {
  ...dispatchSummaryToolbarStyle,
  gridTemplateColumns: "minmax(150px, 220px) minmax(220px, 1fr) auto auto auto",
};

export const dispatchSummaryReadonlyNoteStyle: CSSProperties = {
  alignSelf: "stretch",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  display: "flex",
  alignItems: "center",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.25,
  padding: "8px 10px",
};

export const dispatchSummaryButtonStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: "9px 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  whiteSpace: "nowrap",
};

export const dispatchSummarySecondaryButtonStyle: CSSProperties = {
  ...dispatchSummaryButtonStyle,
  borderColor: "#cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

export const dispatchSuggestionStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.35,
  padding: "8px 10px",
  marginBottom: 10,
};

export const dispatchSummaryTableScrollStyle: CSSProperties = {
  flex: "1 1 auto",
  width: "100%",
  maxWidth: "100%",
  minHeight: 420,
  height: "calc(100dvh - 335px)",
  maxHeight: "none",
  overflowY: "auto",
  overflowX: "hidden",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

export const dispatchSummaryTableStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  borderCollapse: "collapse",
  tableLayout: "auto",
  fontSize: 12,
};

export const dispatchSummaryThStyle: CSSProperties = {
  padding: "7px 8px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
};

export const dispatchSummaryNumberThStyle: CSSProperties = {
  ...dispatchSummaryThStyle,
  textAlign: "center",
};

export const dispatchSummaryTdStyle: CSSProperties = {
  padding: 4,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  verticalAlign: "top",
  background: "inherit",
};

export const dispatchSummaryTdNumberStyle: CSSProperties = {
  ...dispatchSummaryTdStyle,
  verticalAlign: "middle",
};

export const dispatchSummaryReadonlyNumberStyle: CSSProperties = {
  ...dispatchSummaryTdStyle,
  verticalAlign: "middle",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 700,
};

export const dispatchSummaryActionTdStyle: CSSProperties = {
  ...dispatchSummaryTdStyle,
  verticalAlign: "middle",
  textAlign: "center",
  overflow: "visible",
};

export const dispatchSummaryActionGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

export const dispatchSummaryGroupRowStyle: CSSProperties = {
  background: "#eef6ff",
};

export const dispatchSummaryGroupCellStyle: CSSProperties = {
  ...dispatchSummaryTdStyle,
  color: "#0f4c81",
  fontSize: 12,
  fontWeight: 800,
  padding: "6px 8px",
};

export const dispatchSummaryLoaderRowStyle: CSSProperties = {
  background: "#ffffff",
};

export const dispatchSummaryTruckRowStyle: CSSProperties = {
  background: "#f8fafc",
};

export const dispatchSummaryTruckCellStyle: CSSProperties = {
  borderLeftWidth: 3,
  borderLeftStyle: "solid",
  borderLeftColor: "#93c5fd",
};

export const dispatchSummaryTruckLinkCellStyle: CSSProperties = {
  ...dispatchSummaryTdStyle,
  borderLeftWidth: 3,
  borderLeftStyle: "solid",
  borderLeftColor: "#93c5fd",
  color: "#1d4ed8",
  fontSize: 18,
  fontWeight: 800,
  textAlign: "center",
  verticalAlign: "middle",
};

export const dispatchSummaryMutedTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.25,
};

export const dispatchSummaryInputStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 4,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.25,
  outline: "none",
  padding: "5px 6px",
};

export const dispatchSummaryVehicleButtonStyle: CSSProperties = {
  ...dispatchSummaryInputStyle,
  display: "block",
  cursor: "pointer",
  overflow: "hidden",
  textAlign: "left",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const dispatchSummaryNumberInputStyle: CSSProperties = {
  ...dispatchSummaryInputStyle,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
};

export const dispatchSummaryTextareaStyle: CSSProperties = {
  ...dispatchSummaryInputStyle,
  minHeight: 44,
  resize: "vertical",
};

export const dispatchSummaryBadRowStyle: CSSProperties = {
  background: "#fff7ed",
};

export const dispatchSummaryEmptyStyle: CSSProperties = {
  padding: "16px 10px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  color: "#64748b",
  textAlign: "center",
};
