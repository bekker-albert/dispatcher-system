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
  gridTemplateColumns: "minmax(220px, 1fr) minmax(150px, 220px) minmax(260px, 1fr)",
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
  overflow: "auto",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100dvh - 430px)",
  minHeight: 260,
};

export const dispatchSummaryTableStyle: CSSProperties = {
  width: "max-content",
  minWidth: 1700,
  borderCollapse: "collapse",
  tableLayout: "fixed",
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

export const dispatchSummaryInputStyle: CSSProperties = {
  width: "100%",
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
