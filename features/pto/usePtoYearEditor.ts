import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { enqueuePtoDatabaseWrite } from "@/features/pto/ptoSaveQueue";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  normalizePtoYearValue,
  removeYearFromPtoRows,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { uniqueSorted } from "@/lib/utils/text";

type UsePtoYearEditorOptions = {
  ptoYearInput: string;
  ptoPlanYear: string;
  ptoYearTabs: string[];
  databaseConfigured: boolean;
  databaseLoadedRef: RefObject<boolean>;
  setPtoPlanYear: Dispatch<SetStateAction<string>>;
  setPtoYearInput: Dispatch<SetStateAction<string>>;
  setPtoYearDialogOpen: Dispatch<SetStateAction<boolean>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setPtoPlanRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoOperRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  setPtoSurveyRows: Dispatch<SetStateAction<PtoPlanRow[]>>;
  requestSave: () => void;
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  addAdminLog: (entry: AdminLogInput) => void;
};

export function usePtoYearEditor({
  ptoYearInput,
  ptoPlanYear,
  ptoYearTabs,
  databaseConfigured,
  databaseLoadedRef,
  setPtoPlanYear,
  setPtoYearInput,
  setPtoYearDialogOpen,
  setPtoManualYears,
  setExpandedPtoMonths,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  requestSave,
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
  addAdminLog,
}: UsePtoYearEditorOptions) {
  const addPtoYear = useCallback(() => {
    const nextYear = normalizePtoYearValue(ptoYearInput);
    if (!nextYear) return;

    setPtoPlanYear(nextYear);
    setPtoManualYears((current) => uniqueSorted([...current, nextYear]));
    setExpandedPtoMonths((current) => ({ ...current, [`${nextYear}-01`]: true }));
    setPtoYearDialogOpen(false);
    setPtoYearInput("");
    requestSave();
    addAdminLog({
      action: "Добавление",
      section: "ПТО",
      details: `Добавлен год ${nextYear}.`,
    });
  }, [addAdminLog, ptoYearInput, requestSave, setExpandedPtoMonths, setPtoManualYears, setPtoPlanYear, setPtoYearDialogOpen, setPtoYearInput]);

  const deletePtoYear = useCallback(() => {
    const year = normalizePtoYearValue(ptoPlanYear);
    if (!year) return;

    const confirmed = window.confirm(`Вы точно хотите удалить ${year} год? Все данные ПТО за этот год в Плане, Оперучете и Замере будут удалены.`);
    if (!confirmed) return;

    const fallbackYear = ptoYearTabs.find((item) => item !== year) ?? String(Number(year) - 1);

    setPtoPlanRows((current) => removeYearFromPtoRows(current, year));
    setPtoOperRows((current) => removeYearFromPtoRows(current, year));
    setPtoSurveyRows((current) => removeYearFromPtoRows(current, year));
    setPtoManualYears((current) => uniqueSorted([...current.filter((item) => item !== year), fallbackYear]));
    setPtoPlanYear(fallbackYear);
    setPtoYearInput("");
    setPtoYearDialogOpen(false);
    if (databaseConfigured && databaseLoadedRef.current) {
      void enqueuePtoDatabaseWrite(async () => {
        const { deletePtoYearFromDatabase } = await import("@/lib/data/pto");
        const result = await deletePtoYearFromDatabase(year, {
          expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
        });
        markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null);
      })
        .catch((error) => console.warn("Database PTO year delete failed:", error));
    }
    requestSave();
    addAdminLog({
      action: "Удаление",
      section: "ПТО",
      details: `Удален год ${year}.`,
    });
  }, [
    addAdminLog,
    databaseConfigured,
    databaseLoadedRef,
    getPtoDatabaseExpectedUpdatedAt,
    markPtoDatabaseInlineWriteSaved,
    ptoPlanYear,
    ptoYearTabs,
    requestSave,
    setPtoManualYears,
    setPtoOperRows,
    setPtoPlanRows,
    setPtoPlanYear,
    setPtoSurveyRows,
    setPtoYearDialogOpen,
    setPtoYearInput,
  ]);

  return {
    addPtoYear,
    deletePtoYear,
  };
}
