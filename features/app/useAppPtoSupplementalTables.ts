"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoDateExcelTransfer } from "@/features/pto/usePtoDateExcelTransfer";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { PtoBucketColumn, PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type AddAdminLog = (entry: AdminLogInput) => void;
type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

type UseAppPtoSupplementalTablesOptions = {
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoPlanImportInputRef: RefObject<HTMLInputElement | null>;
  setPtoPlanRows: PtoRowsSetter;
  setPtoOperRows: PtoRowsSetter;
  setPtoSurveyRows: PtoRowsSetter;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  requestPtoDatabaseSave: () => void;
  addAdminLog: AddAdminLog;
};

const emptyPtoBucketRows: PtoBucketRow[] = [];
const emptyPtoBucketColumns: PtoBucketColumn[] = [];
const noopCommitPtoBucketValue = () => undefined;
const noopClearPtoBucketCells = () => undefined;
const noopAddPtoBucketManualRow = () => false;
const noopDeletePtoBucketManualRow = () => undefined;

export function useAppPtoSupplementalTables({
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoPlanImportInputRef,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  setPtoManualYears,
  setExpandedPtoMonths,
  requestPtoDatabaseSave,
  addAdminLog,
}: UseAppPtoSupplementalTablesOptions) {
  const {
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
  } = usePtoDateExcelTransfer({
    ptoTab,
    ptoPlanYear,
    ptoAreaFilter,
    ptoPlanRows,
    ptoOperRows,
    ptoSurveyRows,
    importInputRef: ptoPlanImportInputRef,
    setPtoPlanRows,
    setPtoOperRows,
    setPtoSurveyRows,
    setPtoManualYears,
    setExpandedPtoMonths,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    ptoBucketRows: emptyPtoBucketRows,
    ptoBucketColumns: emptyPtoBucketColumns,
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
    commitPtoBucketValue: noopCommitPtoBucketValue,
    clearPtoBucketCells: noopClearPtoBucketCells,
    addPtoBucketManualRow: noopAddPtoBucketManualRow,
    deletePtoBucketManualRow: noopDeletePtoBucketManualRow,
  };
}
