import type { Dispatch, RefObject, SetStateAction } from "react";
import { usePtoDateRowValueEditor } from "@/features/pto/usePtoDateRowValueEditor";
import { usePtoDateTableContext } from "@/features/pto/usePtoDateTableContext";
import { usePtoLinkedRowsEditor } from "@/features/pto/usePtoLinkedRowsEditor";
import { usePtoRowTextDrafts } from "@/features/pto/usePtoRowTextDrafts";
import { usePtoYearEditor } from "@/features/pto/usePtoYearEditor";
import type { PtoRowsSetter } from "@/features/pto/ptoDateTableTypes";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { SubTabConfig } from "@/lib/domain/navigation/tabs";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type AdminLogInput = Omit<AdminLogEntry, "id" | "at" | "user">;

type UseAppPtoDateEditingOptions = {
  addAdminLog: (entry: AdminLogInput) => void;
  databaseConfigured: boolean;
  ptoAreaFilter: string;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  ptoOperRows: PtoPlanRow[];
  ptoPlanRows: PtoPlanRow[];
  ptoPlanYear: string;
  ptoRowFieldDrafts: Record<string, string>;
  ptoSubTabs: SubTabConfig[];
  ptoSurveyRows: PtoPlanRow[];
  ptoTab: string;
  ptoYearInput: string;
  ptoYearTabs: string[];
  requestPtoDatabaseSave: () => void;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setPtoOperRows: PtoRowsSetter;
  setPtoPlanRows: PtoRowsSetter;
  setPtoPlanYear: Dispatch<SetStateAction<string>>;
  setPtoRowFieldDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setPtoSurveyRows: PtoRowsSetter;
  setPtoYearDialogOpen: Dispatch<SetStateAction<boolean>>;
  setPtoYearInput: Dispatch<SetStateAction<string>>;
};

export function useAppPtoDateEditing({
  addAdminLog,
  databaseConfigured,
  ptoAreaFilter,
  ptoDatabaseLoadedRef,
  ptoOperRows,
  ptoPlanRows,
  ptoPlanYear,
  ptoRowFieldDrafts,
  ptoSubTabs,
  ptoSurveyRows,
  ptoTab,
  ptoYearInput,
  ptoYearTabs,
  requestPtoDatabaseSave,
  setExpandedPtoMonths,
  setPtoManualYears,
  setPtoOperRows,
  setPtoPlanRows,
  setPtoPlanYear,
  setPtoRowFieldDrafts,
  setPtoSurveyRows,
  setPtoYearDialogOpen,
  setPtoYearInput,
}: UseAppPtoDateEditingOptions) {
  const {
    currentPtoTableLabel,
    currentPtoDateTableKey,
    savePtoDayPatchToDatabase,
    savePtoDayPatchesToDatabase,
  } = usePtoDateTableContext({
    ptoTab,
    ptoSubTabs,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
  });

  const {
    addLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    getPtoDropPosition,
    moveLinkedPtoDateRow,
  } = usePtoLinkedRowsEditor({
    ptoTab,
    ptoAreaFilter,
    ptoPlanYear,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
    currentPtoTableLabel,
    currentPtoDateTableKey,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    addPtoYear,
    deletePtoYear,
  } = usePtoYearEditor({
    ptoYearInput,
    ptoPlanYear,
    ptoYearTabs,
    databaseConfigured,
    databaseLoadedRef: ptoDatabaseLoadedRef,
    setPtoPlanYear,
    setPtoYearInput,
    setPtoYearDialogOpen,
    setPtoManualYears,
    setExpandedPtoMonths,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  const {
    updatePtoDateRow,
    clearPtoCarryoverOverride,
    updatePtoDateDay,
    updatePtoMonthTotal,
  } = usePtoDateRowValueEditor({
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    ptoPlanYear,
    currentPtoTableLabel,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    saveDayPatch: savePtoDayPatchToDatabase,
    saveDayPatches: savePtoDayPatchesToDatabase,
    addAdminLog,
  });

  const {
    getPtoRowTextDraft,
    beginPtoRowTextDraft,
    updatePtoRowTextDraft,
    commitPtoRowTextDraft,
    cancelPtoRowTextDraft,
  } = usePtoRowTextDrafts({
    drafts: ptoRowFieldDrafts,
    setDrafts: setPtoRowFieldDrafts,
    commitValue: (setRows, row, field, value) => updatePtoDateRow(setRows, row.id, field, value),
    requestSave: requestPtoDatabaseSave,
  });

  return {
    addLinkedPtoDateRow,
    addPtoYear,
    beginPtoRowTextDraft,
    cancelPtoRowTextDraft,
    clearPtoCarryoverOverride,
    commitPtoRowTextDraft,
    deletePtoYear,
    getPtoDropPosition,
    getPtoRowTextDraft,
    moveLinkedPtoDateRow,
    removeLinkedPtoDateRow,
    updatePtoDateDay,
    updatePtoDateRow,
    updatePtoMonthTotal,
    updatePtoRowTextDraft,
  };
}
