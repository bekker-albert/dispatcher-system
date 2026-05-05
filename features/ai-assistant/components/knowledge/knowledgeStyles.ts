import type { CSSProperties } from "react";

import {
  aiAssistantTableStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

export const panelTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

export const validationErrorStyle: CSSProperties = {
  marginBottom: 10,
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "#fff1f2",
  color: "#b91c1c",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 800,
};

export const knowledgeTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 980,
};

export const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  whiteSpace: "nowrap",
};

export const compactCenterThStyle: CSSProperties = {
  ...compactThStyle,
  textAlign: "center",
};

export const textTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

export const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  whiteSpace: "nowrap",
};

export const compactCenterTdStyle: CSSProperties = {
  ...compactTdStyle,
  textAlign: "center",
};

export const editTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  verticalAlign: "top",
};

export const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 8px",
  font: "inherit",
  fontSize: 13,
};

export const rowActionsStyle: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  gap: 5,
  whiteSpace: "nowrap",
};

const baseIconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  cursor: "pointer",
};

export const secondaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

export const primaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

export const dangerIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
};
