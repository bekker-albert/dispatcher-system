"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { ReportEditableHeaderText } from "@/features/reports/ReportEditableHeaderText";

type ReportHeaderActionsOptions = {
  reportHeaderLabel: (key: string, fallback: string) => string;
  editingReportHeaderKey: string | null;
  reportHeaderDraft: string;
  reportEditing: boolean;
  setReportHeaderDraft: Dispatch<SetStateAction<string>>;
  commitReportHeaderEdit: (key: string, fallback: string) => void;
  cancelReportHeaderEdit: () => void;
  startReportHeaderEdit: (key: string, fallback: string) => void;
};

export function useReportHeaderActions({
  reportHeaderLabel,
  editingReportHeaderKey,
  reportHeaderDraft,
  reportEditing,
  setReportHeaderDraft,
  commitReportHeaderEdit,
  cancelReportHeaderEdit,
  startReportHeaderEdit,
}: ReportHeaderActionsOptions) {
  const renderReportHeaderText = useCallback((key: string, fallback: string) => (
    <ReportEditableHeaderText
      columnKey={key}
      fallback={fallback}
      label={reportHeaderLabel(key, fallback)}
      editable={reportEditing}
      isEditing={editingReportHeaderKey === key}
      draft={reportHeaderDraft}
      onDraftChange={setReportHeaderDraft}
      onCommit={commitReportHeaderEdit}
      onCancel={cancelReportHeaderEdit}
      onStartEdit={startReportHeaderEdit}
    />
  ), [
    cancelReportHeaderEdit,
    commitReportHeaderEdit,
    editingReportHeaderKey,
    reportEditing,
    reportHeaderDraft,
    reportHeaderLabel,
    setReportHeaderDraft,
    startReportHeaderEdit,
  ]);

  const printReport = useCallback(() => {
    window.print();
  }, []);

  return {
    renderReportHeaderText,
    printReport,
  };
}
