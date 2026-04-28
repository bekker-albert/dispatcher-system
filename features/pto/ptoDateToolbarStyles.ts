import type { CSSProperties } from "react";

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
