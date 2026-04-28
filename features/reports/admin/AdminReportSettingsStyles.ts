import type { CSSProperties } from "react";

export const sectionWrapStyle: CSSProperties = {
  marginTop: 16,
  display: "grid",
  gap: 12,
  alignItems: "start",
};

export const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

export const customerCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#f8fafc",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
  display: "grid",
  gap: 0,
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  overflow: "hidden",
};

export const customerBodyStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  justifyItems: "start",
  padding: 10,
  borderTop: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box",
  overflowX: "auto",
};
