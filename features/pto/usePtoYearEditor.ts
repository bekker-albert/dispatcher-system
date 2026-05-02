import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { enqueuePtoInlineDatabaseWrite } from "@/features/pto/ptoInlineDatabaseWrite";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import {
  normalizePtoYearValue,
  removeYearFromPtoRows,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { uniqueSorted } from "@/lib/utils/text";

type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

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
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  showSaveStatus: ShowSaveStatus;
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
  showSaveStatus,
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
      enqueuePtoInlineDatabaseWrite({
        label: "удаление года",
        showSaveStatus,
        write: async () => {
          const { deletePtoYearFromDatabase } = await import("@/lib/data/pto");
          return await deletePtoYearFromDatabase(year, {
            expectedUpdatedAt: getPtoDatabaseExpectedUpdatedAt(),
          });
        },
        onSaved: (result) => markPtoDatabaseInlineWriteSaved(result?.updatedAt ?? null, {
          kind: "year",
          action: "delete",
          year,
        }),
      });
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
    showSaveStatus,
  ]);

  return {
    addPtoYear,
    deletePtoYear,
  };
}
