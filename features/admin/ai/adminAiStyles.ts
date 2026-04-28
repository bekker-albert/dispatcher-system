import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#f8fafc",
  marginBottom: 16,
};

export const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: 14,
};

export const titleStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 18,
};

export const descriptionStyle: CSSProperties = {
  color: "#64748b",
  marginTop: 4,
  maxWidth: 900,
};

export const badgeStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "5px 8px",
  background: "#ffffff",
};

export const sourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

export const previewGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1.1fr) minmax(320px, 0.9fr)",
  gap: 14,
  marginTop: 14,
  alignItems: "start",
};

export const innerPanelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
};

export const panelTitleStyle: CSSProperties = {
  fontWeight: 800,
  marginBottom: 8,
};

export const reasonFieldsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: 8,
  marginBottom: 10,
};

export const inputBaseStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};

export const compactInputStyle: CSSProperties = {
  ...inputBaseStyle,
  padding: "8px 10px",
};

export const reasonTextareaStyle: CSSProperties = {
  ...inputBaseStyle,
  minHeight: 78,
  resize: "vertical",
};

export const hintStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  marginTop: 8,
};

export const accumulatedListStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const compactRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 8,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

export const compactRowTitleStyle: CSSProperties = {
  fontWeight: 700,
};

export const compactRowNoteStyle: CSSProperties = {
  color: "#64748b",
  marginTop: 3,
};

export const compactRowHoursStyle: CSSProperties = {
  fontWeight: 800,
};

export const databasePanelStyle: CSSProperties = {
  ...innerPanelStyle,
  marginTop: 14,
};

export const databaseTitleStyle: CSSProperties = {
  fontWeight: 800,
  marginBottom: 10,
};

export const databaseTableWrapStyle: CSSProperties = {
  overflowX: "auto",
};

export const databaseTableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 13,
};

export const databaseHeadRowStyle: CSSProperties = {
  background: "#f1f5f9",
  textAlign: "left",
};

export const ruleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  marginTop: 14,
};

export const ruleBodyStyle: CSSProperties = {
  color: "#475569",
};
