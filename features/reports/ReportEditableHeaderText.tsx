"use client";

import type { CSSProperties } from "react";

type ReportEditableHeaderTextProps = {
  columnKey: string;
  fallback: string;
  label: string;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onCommit: (columnKey: string, fallback: string) => void;
  onCancel: () => void;
  onStartEdit: (columnKey: string, fallback: string) => void;
};

export function ReportEditableHeaderText({
  columnKey,
  fallback,
  label,
  isEditing,
  draft,
  onDraftChange,
  onCommit,
  onCancel,
  onStartEdit,
}: ReportEditableHeaderTextProps) {
  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={(event) => {
          if (event.currentTarget.dataset.cancelReportHeaderEdit === "true") return;
          onCommit(columnKey, fallback);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit(columnKey, fallback);
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.dataset.cancelReportHeaderEdit = "true";
            onCancel();
          }
        }}
        onClick={(event) => event.stopPropagation()}
        style={reportHeaderInputStyle}
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={(event) => {
        event.stopPropagation();
        onStartEdit(columnKey, fallback);
      }}
      style={reportHeaderLabelButtonStyle}
      title="Двойной клик — переименовать заголовок"
    >
      {label}
    </button>
  );
}

const reportHeaderLabelButtonStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "text",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  padding: 0,
  textAlign: "center",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
};

const reportHeaderInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #60a5fa",
  borderRadius: 4,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  padding: "2px 4px",
  textAlign: "center",
};
