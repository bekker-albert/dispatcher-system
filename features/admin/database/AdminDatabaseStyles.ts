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
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 12,
};

export const titleStyle: CSSProperties = {
  fontWeight: 700,
};

export const descriptionStyle: CSSProperties = {
  color: "#64748b",
  marginTop: 4,
};

export const headerActionsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

export const statusCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
  marginBottom: 12,
};

export const statusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

export const summaryLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

export const summaryValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 800,
};

export const summaryNoteStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  marginTop: 4,
};

export const messageStyle: CSSProperties = {
  color: "#475569",
  marginTop: 10,
  fontSize: 13,
};

export const saveInfoStyle: CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  marginTop: 12,
  paddingTop: 12,
};

export const saveInfoTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 4,
};

export const saveInfoTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.4,
};

export const tableScrollStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 13,
};

export const emptyCellStyle: CSSProperties = {
  padding: "14px 10px",
  color: "#64748b",
  textAlign: "center",
};
