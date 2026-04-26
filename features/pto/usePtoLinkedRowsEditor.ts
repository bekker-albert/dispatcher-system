import { useCallback, type Dispatch, type DragEvent, type RefObject, type SetStateAction } from "react";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import {
  createEmptyPtoDateRow,
  insertPtoRowAfter,
  ptoLinkedRowSignature,
  reorderPtoRows,
  type PtoDateTableKey,
  type PtoDropPosition,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { createId } from "@/lib/utils/id";
import { cleanAreaName } from "@/lib/utils/text";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UsePtoLinkedRowsEditorOptions = {
  ptoTab: string;
  ptoAreaFilter: string;
  ptoPlanYear: string;
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  currentPtoTableLabel: () => string;
  currentPtoDateTableKey: () => PtoDateTableKey | null;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  requestSave: () => void;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function usePtoLinkedRowsEditor({
  ptoTab,
  ptoAreaFilter,
  ptoPlanYear,
  databaseConfigured,
  databaseLoadedRef,
  currentPtoTableLabel,
  currentPtoDateTableKey,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  requestSave,
  addAdminLog,
}: UsePtoLinkedRowsEditorOptions) {
  const addLinkedPtoDateRow = useCallback((overrides: Partial<PtoPlanRow> = {}, insertAfterRow?: PtoPlanRow) => {
    const id = createId();
    const sharedOverrides = {
      area: overrides.area,
      location: overrides.location,
      structure: overrides.structure,
      unit: overrides.unit,
      years: overrides.years,
    };
    const planRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "plan" ? overrides : sharedOverrides);
    const operRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "oper" ? overrides : sharedOverrides);
    const surveyRow = createEmptyPtoDateRow("Новая", ptoAreaFilter, ptoPlanYear, id, ptoTab === "survey" ? overrides : sharedOverrides);

    setPtoPlanRows((current) => insertPtoRowAfter(current, insertAfterRow, planRow));
    setPtoOperRows((current) => insertPtoRowAfter(current, insertAfterRow, operRow));
    setPtoSurveyRows((current) => insertPtoRowAfter(current, insertAfterRow, surveyRow));
    requestSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО",
      details: `Добавлена строка в ${currentPtoTableLabel()}.`,
    });

    return id;
  }, [addAdminLog, currentPtoTableLabel, ptoAreaFilter, ptoPlanYear, ptoTab, requestSave, setPtoOperRows, setPtoPlanRows, setPtoSurveyRows]);

  const removeLinkedPtoDateRow = useCallback((row: PtoPlanRow) => {
    const table = currentPtoDateTableKey();
    if (!table) return;
    const rowName = [cleanAreaName(row.area), row.structure].filter(Boolean).join(" / ") || "строку ПТО";
    const confirmed = window.confirm(`Вы точно хотите удалить ${rowName}? Строка удалится только из вкладки "${currentPtoTableLabel()}".`);
    if (!confirmed) return;

    const removeRow = (current: PtoPlanRow[]) => current.filter((item) => item.id !== row.id);

    if (table === "plan") {
      setPtoPlanRows(removeRow);
    } else if (table === "oper") {
      setPtoOperRows(removeRow);
    } else {
      setPtoSurveyRows(removeRow);
    }
    if (databaseConfigured && databaseLoadedRef.current) {
      void import("@/lib/data/pto")
        .then(({ deletePtoRowsFromDatabase }) => deletePtoRowsFromDatabase(table, [row.id]))
        .catch((error) => console.warn("Database PTO row delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `Удалена строка из ${currentPtoTableLabel()}: ${rowName}.`,
    });
  }, [addAdminLog, currentPtoDateTableKey, currentPtoTableLabel, databaseConfigured, databaseLoadedRef, requestSave, setPtoOperRows, setPtoPlanRows, setPtoSurveyRows]);

  const getPtoDropPosition = useCallback((event: DragEvent<HTMLTableRowElement>): PtoDropPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientY - bounds.top > bounds.height / 2 ? "after" : "before";
  }, []);

  const moveLinkedPtoDateRow = useCallback((sourceId: string, targetId: string, visibleRows: PtoPlanRow[], position: PtoDropPosition) => {
    const sourceRow = visibleRows.find((row) => row.id === sourceId);
    const targetRow = visibleRows.find((row) => row.id === targetId);
    if (!sourceRow || !targetRow) return;

    const sourceSignature = ptoLinkedRowSignature(sourceRow);
    const targetSignature = ptoLinkedRowSignature(targetRow);
    const reorderRows = (current: PtoPlanRow[]) => reorderPtoRows(current, sourceRow.id, sourceSignature, targetRow.id, targetSignature, position);

    setPtoPlanRows(reorderRows);
    setPtoOperRows(reorderRows);
    setPtoSurveyRows(reorderRows);
    requestSave();
    addAdminLog({
      action: "Редактирование",
      section: "ПТО",
      details: `Изменен порядок строк в ${currentPtoTableLabel()}.`,
    });
  }, [addAdminLog, currentPtoTableLabel, requestSave, setPtoOperRows, setPtoPlanRows, setPtoSurveyRows]);

  return {
    addLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    getPtoDropPosition,
    moveLinkedPtoDateRow,
  };
}
