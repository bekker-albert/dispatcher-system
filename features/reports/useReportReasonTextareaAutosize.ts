"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

export function syncReportReasonTextareaHeight(element: HTMLTextAreaElement | null) {
  if (!element) return;

  element.style.height = "auto";
  element.style.height = `${Math.max(20, element.scrollHeight)}px`;
}

export function useReportReasonTextareaAutosize(textareaRef: RefObject<HTMLTextAreaElement | null>) {
  const resizeFrameRef = useRef<number | null>(null);

  const cancelScheduledResize = useCallback(() => {
    if (resizeFrameRef.current === null) return;

    window.cancelAnimationFrame(resizeFrameRef.current);
    resizeFrameRef.current = null;
  }, []);

  const syncHeight = useCallback((element: HTMLTextAreaElement | null = textareaRef.current) => {
    syncReportReasonTextareaHeight(element);
  }, [textareaRef]);

  const scheduleFrame = useCallback((callback: () => void) => {
    cancelScheduledResize();
    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      callback();
    });
  }, [cancelScheduledResize]);

  const scheduleHeightSync = useCallback((element?: HTMLTextAreaElement | null) => {
    scheduleFrame(() => syncReportReasonTextareaHeight(element ?? textareaRef.current));
  }, [scheduleFrame, textareaRef]);

  useEffect(() => cancelScheduledResize, [cancelScheduledResize]);

  return {
    scheduleFrame,
    scheduleHeightSync,
    syncHeight,
  };
}
