import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 14,
};

export const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "end",
  flexWrap: "wrap",
  marginBottom: 12,
};

export const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
};

export const mutedTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  marginTop: 4,
};

export const addFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 260px) 34px",
  gap: 8,
  alignItems: "end",
};

export const tableWrapStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  overflowX: "auto",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 720,
  borderCollapse: "collapse",
  fontSize: 13,
};

export const headRowStyle: CSSProperties = {
  background: "#f1f5f9",
  textAlign: "left",
};

export const thStyle: CSSProperties = {
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#cbd5e1",
  padding: "8px 10px",
  whiteSpace: "normal",
};

export const actionThStyle: CSSProperties = {
  ...thStyle,
  width: 116,
};

export const tdStyle: CSSProperties = {
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "#e2e8f0",
  padding: "8px 10px",
  verticalAlign: "middle",
};

export const actionsTdStyle: CSSProperties = {
  ...tdStyle,
  display: "flex",
  justifyContent: "flex-end",
  gap: 6,
};

export const nameStyle: CSSProperties = {
  fontWeight: 700,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  padding: "8px 10px",
};

export const inlineInputStyle: CSSProperties = {
  ...inputStyle,
  padding: "7px 9px",
};
