import type { CSSProperties } from "react";

import {
  aiAssistantTableStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export const plannerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

export const plannerActionsStyle: CSSProperties = {
  display: "inline-flex",
  gap: 5,
  alignItems: "center",
  justifyContent: "center",
};

export const plannerTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1440,
};

export const plannerDateColumnStyle: CSSProperties = { width: 150 };
export const plannerPlanColumnStyle: CSSProperties = { width: "28%" };
export const plannerExecutionColumnStyle: CSSProperties = { width: "32%" };
export const plannerRecipientColumnStyle: CSSProperties = { width: 210 };
export const plannerPriorityColumnStyle: CSSProperties = { width: 118 };
export const plannerStatusColumnStyle: CSSProperties = { width: 158 };
export const plannerActionsColumnStyle: CSSProperties = { width: 84 };

export const aiAssistantTextTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

export const plannerRecipientViewTdStyle: CSSProperties = {
  ...aiAssistantTextTdStyle,
  whiteSpace: "normal",
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

const plannerEditTdBaseStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  verticalAlign: "top",
};

export const plannerDateEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 150,
};

export const plannerMainEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 280,
  overflowWrap: "anywhere",
};

export const plannerRecipientEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 210,
};

export const plannerSelectEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 118,
};

export const plannerStatusEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 158,
};

export const plannerActionsEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  width: 76,
  minWidth: 76,
  textAlign: "center",
};

export const plannerInputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 8px",
  font: "inherit",
  fontSize: 13,
  marginBottom: 5,
};

export const plannerTextareaStyle: CSSProperties = {
  ...plannerInputStyle,
  minHeight: 54,
  resize: "vertical",
};

export const plannerCheckboxStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  color: "#334155",
};
