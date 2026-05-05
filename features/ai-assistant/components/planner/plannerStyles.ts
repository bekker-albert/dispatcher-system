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

export const plannerCalendarLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(330px, 420px) minmax(0, 1fr)",
  gap: 12,
  alignItems: "start",
};

export const plannerCalendarShellStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  padding: 10,
  background: "#f8fafc",
};

export const plannerCalendarHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

export const plannerCalendarTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
  textTransform: "capitalize",
};

export const plannerCalendarWeekStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 4,
  marginBottom: 4,
};

export const plannerCalendarWeekdayStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  textAlign: "center",
};

export const plannerCalendarGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 4,
};

export const plannerCalendarDayStyle: CSSProperties = {
  position: "relative",
  minHeight: 48,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: 6,
  textAlign: "left",
  cursor: "pointer",
};

export const plannerCalendarDayMutedStyle: CSSProperties = {
  ...plannerCalendarDayStyle,
  color: "#94a3b8",
  background: "#f1f5f9",
};

export const plannerCalendarDaySelectedStyle: CSSProperties = {
  ...plannerCalendarDayStyle,
  borderColor: "#2563eb",
  boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.16)",
};

export const plannerCalendarDayNumberStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
};

export const plannerCalendarBadgeStyle: CSSProperties = {
  position: "absolute",
  right: 5,
  bottom: 5,
  minWidth: 18,
  height: 18,
  borderRadius: 999,
  background: "#0f172a",
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
};

export const plannerDayPanelStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  minHeight: 360,
};

export const plannerDayHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
};

export const plannerDayListStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

export const plannerDayTaskCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 10,
  background: "#ffffff",
};

export const plannerDayTaskTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
};

export const plannerDayTaskMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
  marginTop: 6,
};

export const plannerDayTaskActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 5,
};

export const plannerDraftCardStyle: CSSProperties = {
  ...plannerDayTaskCardStyle,
  background: "#f8fafc",
};

export const plannerDraftGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
  gap: 8,
};

export const plannerDraftFullRowStyle: CSSProperties = {
  gridColumn: "1 / -1",
};

export const plannerEmptyDayStyle: CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 14,
  color: "#64748b",
  fontSize: 13,
  textAlign: "center",
  background: "#f8fafc",
};
