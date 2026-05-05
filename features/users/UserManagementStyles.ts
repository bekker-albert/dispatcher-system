import type { CSSProperties } from "react";

export const panelStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  padding: 16,
  minWidth: 0,
};

export const formStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(150px, 1fr)) auto",
  gap: 8,
  marginTop: 14,
  alignItems: "center",
};

export const inputStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "9px 10px",
  fontSize: 13,
  minWidth: 0,
  boxSizing: "border-box",
  width: "100%",
};

export const compactInputStyle: CSSProperties = {
  ...inputStyle,
  padding: "7px 8px",
  fontSize: 12,
};

export const buttonStyle: CSSProperties = {
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

export const tableWrapStyle: CSSProperties = {
  marginTop: 14,
  overflowX: "auto",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

export const cellStyle: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  padding: "8px 6px",
  textAlign: "left",
  verticalAlign: "middle",
};

export const actionCellStyle: CSSProperties = {
  ...cellStyle,
  width: 128,
  textAlign: "right",
  whiteSpace: "nowrap",
};

export const iconButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  marginLeft: 4,
};

export const dangerIconButtonStyle: CSSProperties = {
  ...iconButtonStyle,
  borderColor: "#fecaca",
  color: "#991b1b",
};

export const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
};

export const selectedPanelStyle: CSSProperties = {
  marginTop: 12,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

export const editGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(150px, 1fr))",
  gap: 8,
  marginTop: 10,
};

export const permissionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(150px, 1fr) 92px 92px",
  gap: 6,
  alignItems: "center",
  marginTop: 10,
  maxWidth: 420,
};
