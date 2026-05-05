import type { ReactNode } from "react";

import {
  dangerIconButtonStyle,
  primaryIconButtonStyle,
  secondaryIconButtonStyle,
} from "./integrationStyles";

export function IconButton({
  children,
  label,
  onClick,
  tone = "secondary",
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "secondary";
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
