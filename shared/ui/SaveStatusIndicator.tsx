"use client";

import type { CSSProperties } from "react";

export type SaveStatusState = {
  kind: "idle" | "saving" | "saved" | "error";
  message: string;
};

type SaveStatusIndicatorProps = {
  status: SaveStatusState;
  onClose: () => void;
};

export function SaveStatusIndicator({ status, onClose }: SaveStatusIndicatorProps) {
  if (status.kind === "idle") return null;

  const statusLabel = saveStatusLabels[status.kind];
  const kindStyle = status.kind === "error"
    ? saveStatusErrorStyle
    : status.kind === "saving"
      ? saveStatusSavingStyle
      : saveStatusSavedStyle;

  return (
    <div
      className="app-save-status"
      role={status.kind === "error" ? "alert" : "status"}
      aria-live={status.kind === "error" ? "assertive" : "polite"}
      style={{ ...saveStatusIndicatorStyle, ...kindStyle }}
    >
      <div style={saveStatusMessageStyle}>
        <span style={saveStatusLabelStyle}>{statusLabel}</span>
        <span>{status.message}</span>
      </div>
      <button type="button" aria-label="Закрыть уведомление" onClick={onClose} style={saveStatusCloseButtonStyle}>
        ×
      </button>
    </div>
  );
}

const saveStatusLabels: Record<Exclude<SaveStatusState["kind"], "idle">, string> = {
  saving: "Идет сохранение",
  saved: "Готово",
  error: "Ошибка",
};

const saveStatusIndicatorStyle: CSSProperties = {
  position: "fixed",
  right: 18,
  bottom: 18,
  zIndex: 10000,
  maxWidth: 420,
  padding: "10px 12px",
  borderRadius: 8,
  borderStyle: "solid",
  borderWidth: 1,
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.16)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.25,
};

const saveStatusMessageStyle: CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const saveStatusLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.1,
  opacity: 0.82,
  textTransform: "uppercase",
};

const saveStatusCloseButtonStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1,
  padding: 0,
};

const saveStatusSavingStyle: CSSProperties = {
  background: "#111827",
  borderColor: "#111827",
  color: "#ffffff",
};

const saveStatusSavedStyle: CSSProperties = {
  background: "#f8fafc",
  borderColor: "#0f172a",
  color: "#0f172a",
};

const saveStatusErrorStyle: CSSProperties = {
  background: "#fef2f2",
  borderColor: "#b91c1c",
  color: "#991b1b",
};
