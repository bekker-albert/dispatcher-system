import type { CSSProperties } from "react";

import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

export const workspaceStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: 10,
};

export const draftListStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 0,
};

export const sectionTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: 17,
  fontWeight: 900,
};

export const draftButtonsStyle: CSSProperties = {
  display: "grid",
  gap: 7,
  marginTop: 10,
};

export const previewHintStyle: CSSProperties = {
  marginTop: 8,
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 700,
};

export const draftButtonStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 8,
  alignItems: "start",
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  padding: 9,
  color: "#0f172a",
  textAlign: "left",
  cursor: "pointer",
};

export const draftButtonTextStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

export const draftButtonTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
};

export const viewerStyle: CSSProperties = {
  ...aiAssistantPanelStyle,
  minHeight: 420,
  display: "grid",
  gridTemplateRows: "auto minmax(220px, 1fr) auto",
  gap: 10,
};

export const viewerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
};

export const viewerActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  justifyContent: "flex-end",
};

export const viewerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: "7px 9px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

export const primaryViewerButtonStyle: CSSProperties = {
  ...viewerButtonStyle,
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

export const viewerBodyStyle: CSSProperties = {
  border: "1px solid #dbe3ec",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  padding: 14,
  whiteSpace: "pre-wrap",
  overflow: "auto",
  lineHeight: 1.55,
};

export const viewerTextareaStyle: CSSProperties = {
  ...viewerBodyStyle,
  width: "100%",
  resize: "vertical",
  font: "inherit",
  outline: "none",
};

export const feedbackStyle: CSSProperties = {
  border: "1px solid #fde68a",
  borderRadius: 8,
  background: "#fffbeb",
  color: "#92400e",
  padding: 8,
  fontSize: 12,
  fontWeight: 800,
};

export const emptyWorkspaceStyle: CSSProperties = {
  ...aiAssistantMutedTextStyle,
  alignSelf: "center",
  justifySelf: "center",
};
