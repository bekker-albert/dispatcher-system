import type { CSSProperties } from "react";

export const homeHeroStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  marginBottom: 12,
};

export const homeTitleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
};

export const requestRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
};

export const requestInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "12px 12px",
  font: "inherit",
  fontSize: 15,
};

export const requestButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "0 14px",
  fontWeight: 900,
  cursor: "pointer",
};

export const quickCommandsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

export const quickCommandStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "7px 9px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

export const requestFeedbackStyle: CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 800,
};

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 8,
  marginBottom: 12,
};

export const summaryCardStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  textAlign: "left",
  cursor: "pointer",
};

export const summaryValueStyle: CSSProperties = {
  display: "block",
  color: "#0f172a",
  fontSize: 24,
  fontWeight: 900,
};

export const summaryTitleStyle: CSSProperties = {
  display: "block",
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
};

export const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
};

export const homeBlockStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

export const homeBlockTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 900,
  marginBottom: 8,
};

export const homeBlockListStyle: CSSProperties = {
  display: "grid",
  gap: 7,
};

export const miniCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 9,
  background: "#f8fafc",
};

export const miniCardTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 900,
};

export const contextLineStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  marginTop: 5,
};

export const miniActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 5,
  marginTop: 8,
};

export const primaryMiniButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  border: "1px solid #0f172a",
  borderRadius: 8,
  background: "#0f172a",
  color: "#ffffff",
  padding: "5px 7px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

export const secondaryMiniButtonStyle: CSSProperties = {
  ...primaryMiniButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

export const todayRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "center",
  marginBottom: 5,
};

export const timeStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 12,
  fontWeight: 900,
};

export const openButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "5px 7px",
  fontSize: 12,
  fontWeight: 800,
  marginTop: 7,
  cursor: "pointer",
};

export const draftTitleRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
};

export const latestActionStyle: CSSProperties = {
  borderBottom: "1px solid #e2e8f0",
  paddingBottom: 6,
};

export const latestActionTitleStyle: CSSProperties = {
  display: "block",
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 900,
};

export const emptyLineStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 10,
};
