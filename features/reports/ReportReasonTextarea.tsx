"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type ReportReasonTextareaProps = {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
  onDraftChange?: (value: string) => void;
};

function syncReportReasonTextareaHeight(element: HTMLTextAreaElement | null) {
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${Math.max(34, element.scrollHeight)}px`;
}

export function ReportReasonTextarea({
  value,
  placeholder,
  onCommit,
  onDraftChange,
}: ReportReasonTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const focusedRef = useRef(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (focusedRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      setDraft(value);
      window.requestAnimationFrame(() => syncReportReasonTextareaHeight(textareaRef.current));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  useEffect(() => {
    syncReportReasonTextareaHeight(textareaRef.current);
  }, [draft]);

  function commitTextarea(nextValue: string) {
    focusedRef.current = false;
    setDraft(nextValue);
    onCommit(nextValue);
    window.requestAnimationFrame(() => syncReportReasonTextareaHeight(textareaRef.current));
  }

  return (
    <textarea
      ref={textareaRef}
      className="report-reason-input"
      value={draft}
      rows={1}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={(event) => commitTextarea(event.currentTarget.value)}
      onInput={(event) => {
        syncReportReasonTextareaHeight(event.currentTarget);
        onDraftChange?.(event.currentTarget.value);
      }}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      onKeyDown={(event) => {
        event.stopPropagation();

        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commitTextarea(event.currentTarget.value);
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          focusedRef.current = false;
          event.currentTarget.value = value;
          setDraft(value);
          syncReportReasonTextareaHeight(event.currentTarget);
          event.currentTarget.blur();
        }

        if (event.key === "Delete" && event.ctrlKey) {
          event.preventDefault();
          event.currentTarget.value = "";
          syncReportReasonTextareaHeight(event.currentTarget);
          commitTextarea("");
          event.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      style={reportReasonTextareaStyle}
    />
  );
}

const reportReasonTextareaStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 34,
  height: "auto",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "inherit",
  display: "block",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: 1.25,
  outline: "none",
  overflow: "hidden",
  padding: 0,
  resize: "none",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "pre-wrap",
};
