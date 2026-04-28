"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEditableHeaderLabels } from "@/components/shared/useEditableHeaderLabels";
import { useReportHeaderActions } from "@/features/reports/useReportHeaderActions";
import type { AdminLogInput } from "@/lib/domain/admin/logs";

type UseAppHeaderEditorsOptions = {
  ptoHeaderLabels: Record<string, string>;
  ptoHeaderDraft: string;
  setPtoHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setEditingPtoHeaderKey: Dispatch<SetStateAction<string | null>>;
  setPtoHeaderDraft: Dispatch<SetStateAction<string>>;
  reportHeaderLabels: Record<string, string>;
  reportHeaderDraft: string;
  editingReportHeaderKey: string | null;
  setReportHeaderLabels: Dispatch<SetStateAction<Record<string, string>>>;
  setEditingReportHeaderKey: Dispatch<SetStateAction<string | null>>;
  setReportHeaderDraft: Dispatch<SetStateAction<string>>;
  requestPtoDatabaseSave: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function useAppHeaderEditors({
  ptoHeaderLabels,
  ptoHeaderDraft,
  setPtoHeaderLabels,
  setEditingPtoHeaderKey,
  setPtoHeaderDraft,
  reportHeaderLabels,
  reportHeaderDraft,
  editingReportHeaderKey,
  setReportHeaderLabels,
  setEditingReportHeaderKey,
  setReportHeaderDraft,
  requestPtoDatabaseSave,
  addAdminLog,
}: UseAppHeaderEditorsOptions) {
  const {
    headerLabel: ptoHeaderLabel,
    startHeaderEdit: startPtoHeaderEdit,
    cancelHeaderEdit: cancelPtoHeaderEdit,
    commitHeaderEdit: commitPtoHeaderEdit,
  } = useEditableHeaderLabels({
    labels: ptoHeaderLabels,
    draft: ptoHeaderDraft,
    setLabels: setPtoHeaderLabels,
    setEditingKey: setEditingPtoHeaderKey,
    setDraft: setPtoHeaderDraft,
    onCommit: (_key, fallback) => {
      requestPtoDatabaseSave();
      addAdminLog({
        action: "Редактирование",
        section: "ПТО",
        details: `Изменен заголовок таблицы: ${fallback}.`,
      });
    },
  });

  const {
    headerLabel: reportHeaderLabel,
    startHeaderEdit: startReportHeaderEdit,
    cancelHeaderEdit: cancelReportHeaderEdit,
    commitHeaderEdit: commitReportHeaderEdit,
  } = useEditableHeaderLabels({
    labels: reportHeaderLabels,
    draft: reportHeaderDraft,
    setLabels: setReportHeaderLabels,
    setEditingKey: setEditingReportHeaderKey,
    setDraft: setReportHeaderDraft,
    onCommit: (_key, fallback) => {
      addAdminLog({
        action: "Редактирование",
        section: "Отчетность",
        details: `Изменен заголовок таблицы: ${fallback}.`,
      });
    },
  });

  const {
    renderReportHeaderText,
    printReport,
  } = useReportHeaderActions({
    reportHeaderLabel,
    editingReportHeaderKey,
    reportHeaderDraft,
    setReportHeaderDraft,
    commitReportHeaderEdit,
    cancelReportHeaderEdit,
    startReportHeaderEdit,
  });

  return {
    cancelPtoHeaderEdit,
    commitPtoHeaderEdit,
    printReport,
    ptoHeaderLabel,
    renderReportHeaderText,
    startPtoHeaderEdit,
    reportHeaderLabel,
  };
}
