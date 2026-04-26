import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { PtoResizeState } from "@/features/pto/ptoDateInteractionTypes";
import type { ReportResizeState } from "@/features/reports/lib/reportResizeState";

type AddAdminLog = (entry: Omit<AdminLogEntry, "id" | "at" | "user">) => void;

type UseTableResizeHandlersOptions = {
  ptoRowHeights: Record<string, number>;
  setPtoColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoRowHeights: Dispatch<SetStateAction<Record<string, number>>>;
  setReportColumnWidths: Dispatch<SetStateAction<Record<string, number>>>;
  requestSave: () => void;
  addAdminLog: AddAdminLog;
};

function clearResizeCursor() {
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

export function useTableResizeHandlers({
  ptoRowHeights,
  setPtoColumnWidths,
  setPtoRowHeights,
  setReportColumnWidths,
  requestSave,
  addAdminLog,
}: UseTableResizeHandlersOptions) {
  const ptoResizeStateRef = useRef<PtoResizeState | null>(null);
  const reportResizeStateRef = useRef<ReportResizeState | null>(null);

  useEffect(() => {
    const handleResizeMove = (event: MouseEvent) => {
      const resizeState = ptoResizeStateRef.current;
      if (resizeState) {
        if (resizeState.type === "column") {
          const nextWidth = Math.min(800, Math.max(44, Math.round(resizeState.startWidth + event.clientX - resizeState.startX)));
          setPtoColumnWidths((current) => (current[resizeState.key] === nextWidth ? current : { ...current, [resizeState.key]: nextWidth }));
          return;
        }

        const nextHeight = Math.min(180, Math.max(28, Math.round(resizeState.startHeight + event.clientY - resizeState.startY)));
        setPtoRowHeights((current) => (current[resizeState.key] === nextHeight ? current : { ...current, [resizeState.key]: nextHeight }));
        return;
      }

      const reportResizeState = reportResizeStateRef.current;
      if (!reportResizeState) return;

      const nextWidth = Math.min(520, Math.max(42, Math.round(reportResizeState.startWidth + event.clientX - reportResizeState.startX)));
      setReportColumnWidths((current) => (current[reportResizeState.key] === nextWidth ? current : { ...current, [reportResizeState.key]: nextWidth }));
    };

    const handleResizeEnd = () => {
      const resizeState = ptoResizeStateRef.current;
      const reportResizeState = reportResizeStateRef.current;
      if (!resizeState && !reportResizeState) return;

      ptoResizeStateRef.current = null;
      reportResizeStateRef.current = null;
      clearResizeCursor();
      requestSave();
      addAdminLog({
        action: "Редактирование",
        section: reportResizeState ? "Отчетность" : "ПТО",
        details: reportResizeState
          ? "Изменена ширина столбца отчетности."
          : resizeState?.type === "column" ? "Изменена ширина столбца." : "Изменена высота строки.",
      });
    };

    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
      clearResizeCursor();
    };
  }, [addAdminLog, requestSave, setPtoColumnWidths, setPtoRowHeights, setReportColumnWidths]);

  const startPtoColumnResize = useCallback((event: React.MouseEvent<HTMLElement>, key: string, width: number) => {
    event.preventDefault();
    event.stopPropagation();
    ptoResizeStateRef.current = { type: "column", key, startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const startReportColumnResize = useCallback((event: React.MouseEvent<HTMLElement>, key: string, width: number) => {
    event.preventDefault();
    event.stopPropagation();
    reportResizeStateRef.current = { key, startX: event.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const startPtoRowResize = useCallback((event: React.MouseEvent<HTMLElement>, key: string) => {
    event.preventDefault();
    event.stopPropagation();
    const rowElement = event.currentTarget.closest("tr");
    const startHeight = rowElement?.getBoundingClientRect().height ?? ptoRowHeights[key] ?? 34;

    ptoResizeStateRef.current = { type: "row", key, startY: event.clientY, startHeight };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [ptoRowHeights]);

  return {
    startPtoColumnResize,
    startReportColumnResize,
    startPtoRowResize,
  };
}
