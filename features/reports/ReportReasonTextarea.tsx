"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReportReasonTextareaAutosize } from "./useReportReasonTextareaAutosize";

type ReportReasonTextareaProps = {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
  onCancel?: (value: string) => void;
};

export function ReportReasonTextarea({
  value,
  placeholder,
  onCommit,
  onCancel,
}: ReportReasonTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const focusedRef = useRef(false);
  const cancelNextBlurRef = useRef(false);
  const skipNextBlurCommitRef = useRef(false);
  const editInitialValueRef = useRef(value);
  const [draft, setDraft] = useState(value);
  const { scheduleFrame, scheduleHeightSync, syncHeight } = useReportReasonTextareaAutosize(textareaRef);

  useEffect(() => {
    if (focusedRef.current) return;

    scheduleFrame(() => setDraft(value));
  }, [scheduleFrame, value]);

  useEffect(() => {
    syncHeight();
  }, [draft, syncHeight]);

  function commitTextarea(nextValue: string) {
    focusedRef.current = false;
    setDraft(nextValue);
    if (nextValue !== value) {
      onCommit(nextValue);
    }
    scheduleHeightSync();
  }

  function cancelTextarea() {
    const previousValue = editInitialValueRef.current;
    cancelNextBlurRef.current = true;
    focusedRef.current = false;
    setDraft(previousValue);
    onCancel?.(previousValue);
    scheduleHeightSync();
  }

  return (
    <>
      <textarea
        ref={textareaRef}
        className="report-reason-input"
        value={draft}
        rows={1}
        onFocus={() => {
          focusedRef.current = true;
          editInitialValueRef.current = value;
        }}
        onBlur={(event) => {
          if (skipNextBlurCommitRef.current) {
            skipNextBlurCommitRef.current = false;
            syncHeight(event.currentTarget);
            return;
          }

          if (cancelNextBlurRef.current) {
            cancelNextBlurRef.current = false;
            event.currentTarget.value = editInitialValueRef.current;
            syncHeight(event.currentTarget);
            return;
          }

          commitTextarea(event.currentTarget.value);
        }}
        onInput={(event) => {
          syncHeight(event.currentTarget);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          event.stopPropagation();

          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            commitTextarea(event.currentTarget.value);
            skipNextBlurCommitRef.current = true;
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.value = editInitialValueRef.current;
            cancelTextarea();
            syncHeight(event.currentTarget);
            event.currentTarget.blur();
          }

          if (event.key === "Delete" && event.ctrlKey) {
            event.preventDefault();
            event.currentTarget.value = "";
            syncHeight(event.currentTarget);
            commitTextarea("");
            skipNextBlurCommitRef.current = true;
            event.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        style={reportReasonTextareaStyle}
      />
      <div className="report-reason-print-value" aria-hidden="true" style={reportReasonPrintValueStyle}>
        {draft}
      </div>
    </>
  );
}

const reportReasonTextareaStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: 20,
  height: "auto",
  boxSizing: "border-box",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "inherit",
  display: "block",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: 1.08,
  outline: "none",
  overflow: "hidden",
  padding: 0,
  resize: "none",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "pre-wrap",
};

const reportReasonPrintValueStyle: CSSProperties = {
  display: "none",
  fontFamily: "inherit",
  fontSize: "inherit",
  lineHeight: 1.08,
  textAlign: "center",
  whiteSpace: "pre-wrap",
  width: "100%",
};
