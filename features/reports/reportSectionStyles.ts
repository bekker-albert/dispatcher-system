import type { CSSProperties } from "react";

export const reportTableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
  fontSize: 12,
  background: "#ffffff",
};

export const reportTitleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
};

export const reportPrintFirstTitleStyle: CSSProperties = {
  display: "none",
};

export const reportAreaTabsToolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 12,
};

export const reportAreaTabsListStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  minWidth: 0,
};

export const reportWorkspaceStyle: CSSProperties = {
  height: "calc(100dvh - 232px)",
  minHeight: 320,
  display: "grid",
  gridTemplateRows: "minmax(0, 1fr)",
};

export const reportPanelStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr)",
  gap: 8,
};

export const reportTableScrollStyle: CSSProperties = {
  overflowX: "hidden",
  overflowY: "auto",
  minHeight: 0,
  border: "2px solid #64748b",
  borderRadius: 8,
  background: "#ffffff",
};

export const reportGaugeGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 10,
  marginBottom: 4,
};

export const reportAreaGroupStartRowStyle: CSSProperties = {
  borderTop: "2px solid #64748b",
};
