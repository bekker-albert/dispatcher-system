import type { CSSProperties } from "react";

import { aiAssistantTaskStatusColors, aiAssistantTaskStatusLabels } from "@/lib/domain/ai-assistant/status";
import type { AiAssistantTaskStatus } from "@/features/ai-assistant/types";

export function AiAssistantStatusPill({ status }: { status: AiAssistantTaskStatus }) {
  const colors = aiAssistantTaskStatusColors[status];
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    padding: "3px 8px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.background,
    color: colors.color,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };

  return <span style={style}>{aiAssistantTaskStatusLabels[status]}</span>;
}
