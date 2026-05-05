import type { CSSProperties } from "react";

import {
  aiAssistantTdStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export const tasksBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

export const tasksHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

export const tasksToolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(240px, 1fr) 210px",
  gap: 8,
  alignItems: "center",
  marginTop: 10,
};

export const tasksSearchInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 10px",
  font: "inherit",
  fontSize: 13,
};

export const tasksStatusSelectStyle: CSSProperties = {
  ...tasksSearchInputStyle,
  cursor: "pointer",
};

export const statusSummaryStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 8,
};

export const statusSummaryItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#334155",
  padding: "4px 7px",
  fontSize: 12,
  fontWeight: 800,
};

export const tasksBlockTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

export const queueSectionTitleStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  padding: "4px 8px",
  fontSize: 12,
  fontWeight: 900,
  color: "#334155",
};

export const taskCardsStyle: CSSProperties = {
  display: "grid",
  gap: 7,
};

export const taskCardStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: "9px 10px",
};

export const taskCardTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 1fr) auto",
  alignItems: "start",
  gap: 10,
};

export const taskCardMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: 6,
};

export const taskCardTextStyle: CSSProperties = {
  color: "#334155",
  fontSize: 12,
  lineHeight: 1.35,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const emptyTaskStateStyle: CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 14,
  color: "#64748b",
  textAlign: "center",
  background: "#ffffff",
  fontSize: 13,
};

export const aiAssistantTextTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

export const aiAssistantMultilineTdStyle: CSSProperties = {
  ...aiAssistantTextTdStyle,
  whiteSpace: "pre-wrap",
};

export const approvalTextareaStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  minHeight: 90,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  padding: 8,
  font: "inherit",
};

export const iconActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: 5,
};

export const baseIconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  minHeight: 28,
  padding: "0 7px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

export const primaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

export const dangerIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #b91c1c",
  background: "#ffffff",
  color: "#b91c1c",
};

export const secondaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};
