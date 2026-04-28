import type { CSSProperties } from "react";

export const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

export const summaryColumnStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  alignContent: "start",
  minWidth: 420,
  maxWidth: 720,
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 8,
};

export const summaryListHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px minmax(170px, 1fr) minmax(50px, auto) 22px 22px",
  gap: 6,
  alignItems: "center",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.15,
  padding: "0 2px",
};

export const summaryCardStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 6,
};

export const summaryFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px minmax(170px, 1fr) minmax(50px, auto) 22px 22px",
  gap: 6,
  alignItems: "center",
};

export const summaryCompactInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  lineHeight: 1.2,
  outline: "none",
  padding: "5px 6px",
};

export const summaryValueStyle: CSSProperties = {
  minWidth: 0,
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const summaryUnitValueStyle: CSSProperties = {
  ...summaryValueStyle,
  textAlign: "right",
};

export const summaryNoteStyle: CSSProperties = {
  minWidth: 0,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const summarySelectionPanelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 6,
};

export const summaryPlanPickerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "92px minmax(0, 1fr)",
  gap: 6,
  alignItems: "center",
};

export const summaryRowsHeaderStyle: CSSProperties = {
  color: "#475569",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.2,
};

export const summaryRowsGridStyle: CSSProperties = {
  display: "grid",
  gap: 5,
  maxHeight: 180,
  overflowY: "auto",
  paddingRight: 2,
};

export const summaryRowOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 1fr) minmax(34px, auto)",
  alignItems: "center",
  gap: 6,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#ffffff",
  padding: "5px 6px",
  color: "#0f172a",
  fontSize: 11,
  fontWeight: 400,
};

export const summaryRowNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.18,
  overflowWrap: "normal",
  wordBreak: "normal",
};

export const summaryRowUnitStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 400,
  justifySelf: "end",
  textAlign: "right",
  whiteSpace: "nowrap",
};

export const emptyTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};
