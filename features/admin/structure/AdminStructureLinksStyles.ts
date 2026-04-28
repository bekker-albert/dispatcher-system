import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#ffffff",
  marginBottom: 16,
};

export const titleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 12,
};

export const tableHeaderRowStyle: CSSProperties = {
  background: "#f1f5f9",
  textAlign: "left",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1180,
  borderCollapse: "collapse",
  fontSize: 14,
};

export const actionButtonsStyle: CSSProperties = {
  display: "flex",
  gap: 6,
};

export const detailCellStyle: CSSProperties = {
  padding: 10,
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
};

export const inlineEditStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  alignItems: "end",
};

export const addFormStyle: CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr)) auto",
  gap: 10,
  alignItems: "end",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: 14,
  background: "#ffffff",
};
