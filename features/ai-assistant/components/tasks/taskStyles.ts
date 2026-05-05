import type { CSSProperties } from "react";

import {
  aiAssistantTableStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
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

export const tasksBlockTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

export const queueSectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

export const tasksTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1080,
};

export const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  whiteSpace: "nowrap",
};

export const compactCenterThStyle: CSSProperties = {
  ...compactThStyle,
  textAlign: "center",
};

export const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  whiteSpace: "nowrap",
};

export const compactCenterTdStyle: CSSProperties = {
  ...compactTdStyle,
  textAlign: "center",
};

export const emptyTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  color: "#64748b",
  textAlign: "center",
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
  justifyContent: "center",
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
