import type { CSSProperties } from "react";

export const helperTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
};

export const factSourceCellStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 22px",
  alignItems: "center",
  gap: 4,
};

export const factSourceOwnBadgeStyle: CSSProperties = {
  minWidth: 0,
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const factSourceSumBadgeStyle: CSSProperties = {
  ...factSourceOwnBadgeStyle,
  color: "#0f172a",
};

export const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 50,
  display: "grid",
  placeItems: "center",
  background: "rgba(15, 23, 42, 0.18)",
  padding: 16,
};

export const modalStyle: CSSProperties = {
  width: "min(760px, calc(100vw - 32px))",
  maxHeight: "min(680px, calc(100vh - 32px))",
  overflow: "auto",
  display: "grid",
  gap: 10,
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.22)",
  padding: 12,
};

export const modalHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 22px",
  alignItems: "center",
  gap: 8,
};

export const modalTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 800,
};

export const targetStyle: CSSProperties = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.3,
};

export const modeRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

export const modeButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  padding: "7px 10px",
};

export const modeActiveStyle: CSSProperties = {
  ...modeButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

export const sourceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 6,
};

export const sourceOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) max-content",
  gap: 6,
  alignItems: "center",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  background: "#ffffff",
  padding: "5px 7px",
};

export const sourceNameStyle: CSSProperties = {
  minWidth: 0,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.18,
  overflowWrap: "normal",
  wordBreak: "normal",
};

export const sourceUnitStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 400,
  justifySelf: "end",
  textAlign: "right",
};
