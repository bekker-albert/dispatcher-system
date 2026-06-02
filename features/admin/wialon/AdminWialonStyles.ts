import type { CSSProperties } from "react";

export const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

export const titleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 18,
  fontWeight: 900,
  margin: 0,
};

export const subtitleStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 700,
  marginTop: 4,
};

export const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

export const buttonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  padding: "8px 12px",
};

export const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  borderColor: "#2563eb",
  background: "#2563eb",
  color: "#ffffff",
};

export const statusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

export const statusCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 12,
};

export const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
};

export const valueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 900,
  marginTop: 4,
};

export const tableWrapStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  overflow: "auto",
  maxHeight: "calc(100dvh - 330px)",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 980,
  borderCollapse: "collapse",
  fontSize: 12,
};

export const thStyle: CSSProperties = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#0f172a",
  fontWeight: 900,
  padding: "8px 9px",
  position: "sticky",
  textAlign: "left",
  top: 0,
};

export const tdStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  color: "#334155",
  padding: "7px 9px",
  verticalAlign: "top",
};

export const selectStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  color: "#0f172a",
  font: "inherit",
  padding: "6px 7px",
};

export const errorStyle: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: 12,
  fontWeight: 800,
  padding: "8px 10px",
};
