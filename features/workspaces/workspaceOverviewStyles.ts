import type { CSSProperties } from "react";

import type { DispatchWorkspaceDefinition } from "@/lib/domain/workspaces/workspaces";

export function statusStyle(status: DispatchWorkspaceDefinition["status"]): CSSProperties {
  const color = status === "active" ? "#166534" : status === "scaffold" ? "#075985" : "#92400e";
  const background = status === "active" ? "#dcfce7" : status === "scaffold" ? "#e0f2fe" : "#fef3c7";

  return {
    alignItems: "center",
    background,
    borderRadius: 6,
    color,
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 900,
    lineHeight: 1,
    padding: "5px 7px",
    textTransform: "uppercase",
  };
}

export const heroStyle: CSSProperties = {
  alignItems: "start",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 14,
  gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 420px)",
  marginBottom: 14,
  padding: 14,
};

export const eyebrowStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0,
  marginBottom: 4,
};

export const titleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 24,
  lineHeight: 1.15,
  margin: 0,
};

export const leadStyle: CSSProperties = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.45,
  margin: "8px 0 0",
  maxWidth: 920,
};

export const summaryGridStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  gridTemplateColumns: "repeat(2, minmax(130px, 1fr))",
};

export const metricStyle: CSSProperties = {
  alignItems: "center",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 8,
  gridTemplateColumns: "auto minmax(0, 1fr)",
  minHeight: 58,
  padding: 10,
};

export const metricIconStyle: CSSProperties = {
  alignItems: "center",
  background: "#eff6ff",
  borderRadius: 8,
  color: "#1d4ed8",
  display: "inline-flex",
  height: 34,
  justifyContent: "center",
  width: 34,
};

export const metricValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 900,
  lineHeight: 1.15,
};

export const metricLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 700,
};

export const workspaceGridStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
};

export const workspaceCardStyle: CSSProperties = {
  alignContent: "start",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 10,
  minHeight: 250,
  padding: 12,
};

export const workspaceHeaderStyle: CSSProperties = {
  alignItems: "start",
  display: "flex",
  gap: 10,
  justifyContent: "space-between",
};

export const cardTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 17,
  lineHeight: 1.2,
  margin: "8px 0 0",
};

export const cardTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.4,
  margin: 0,
};

export const readinessStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  display: "grid",
  gap: 6,
  padding: 9,
};

export const readinessHeaderStyle: CSSProperties = {
  alignItems: "center",
  color: "#334155",
  display: "flex",
  fontSize: 12,
  fontWeight: 800,
  justifyContent: "space-between",
};

export const readinessBarTrackStyle: CSSProperties = {
  background: "#e2e8f0",
  borderRadius: 999,
  height: 7,
  overflow: "hidden",
};

export const readinessBarFillStyle: CSSProperties = {
  background: "#0f766e",
  borderRadius: 999,
  height: "100%",
};

export const readinessNextStepStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.3,
};

export const catalogSummaryStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
};

export const handlerRolloutStyle: CSSProperties = {
  color: "#0f766e",
  fontSize: 12,
  fontWeight: 900,
};

export const roadmapStyle: CSSProperties = {
  color: "#1e40af",
  fontSize: 12,
  fontWeight: 900,
};

export const moduleListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 5,
};

export const modulePillStyle: CSSProperties = {
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  color: "#334155",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.2,
  padding: "5px 6px",
};

export const actionButtonStyle: CSSProperties = {
  alignItems: "center",
  background: "#0f172a",
  border: "1px solid #0f172a",
  borderRadius: 8,
  color: "#ffffff",
  cursor: "pointer",
  display: "inline-flex",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 900,
  gap: 6,
  justifyContent: "center",
  justifySelf: "start",
  marginTop: "auto",
  padding: "8px 10px",
};

export const disabledActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "#f1f5f9",
  borderColor: "#e2e8f0",
  color: "#94a3b8",
  cursor: "not-allowed",
};
