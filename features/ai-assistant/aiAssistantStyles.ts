import type { CSSProperties } from "react";

export const aiAssistantShellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: "calc(100vh - 140px)",
};

export const aiAssistantHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 12,
  alignItems: "start",
};

export const aiAssistantTitleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  margin: 0,
};

export const aiAssistantSubtitleStyle: CSSProperties = {
  fontSize: 13,
  color: "#475569",
  marginTop: 4,
  maxWidth: 760,
  lineHeight: 1.45,
};

export const aiAssistantTabsStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-start",
};

export const aiAssistantCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
};

export const aiAssistantPanelStyle: CSSProperties = {
  ...aiAssistantCardStyle,
  minHeight: 260,
};

export const aiAssistantTableWrapStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
};

export const aiAssistantTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontSize: 13,
};

export const aiAssistantThStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 800,
  textAlign: "left",
  padding: "9px 10px",
  borderBottom: "1px solid #cbd5e1",
  whiteSpace: "normal",
};

export const aiAssistantTdStyle: CSSProperties = {
  padding: "9px 10px",
  borderBottom: "1px solid #e2e8f0",
  color: "#0f172a",
  verticalAlign: "middle",
};

export const aiAssistantMutedTextStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.4,
};

export const aiAssistantTwoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1.1fr) minmax(280px, 0.9fr)",
  gap: 12,
};

export const aiAssistantListStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const aiAssistantListItemStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};
