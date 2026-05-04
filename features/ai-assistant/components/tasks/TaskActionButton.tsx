import type { ReactNode } from "react";

import {
  dangerIconButtonStyle,
  primaryIconButtonStyle,
  secondaryIconButtonStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";

export function TaskActionButton({
  label,
  tone = "secondary",
  onClick,
  children,
}: {
  label: string;
  tone?: "primary" | "danger" | "secondary";
  onClick: () => void;
  children: ReactNode;
}) {
  const style = tone === "primary"
    ? primaryIconButtonStyle
    : tone === "danger"
      ? dangerIconButtonStyle
      : secondaryIconButtonStyle;

  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={style}>
      {children}
    </button>
  );
}
