"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import { usePtoDateExcelTransfer } from "@/features/pto/usePtoDateExcelTransfer";
import type { AdminLogEntry } from "@/lib/domain/admin/logs";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type AddAdminLog = (entry: Omit<AdminLogEntry, "id" | "at" | "user">) => void;
type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

type UseAppPtoSupplementalTablesOptions = {
  isPtoBucketsSection: boolean;
  allPtoDateRows: PtoPlanRow[];
  deferredVehicleRows: VehicleRow[];
  ptoTab: string;
  ptoPlanYear: string;
  ptoAreaFilter: string;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoBucketManualRows: PtoBucketRow[];
  ptoPlanImportInputRef: RefObject<HTMLInputElement | null>;
  setPtoPlanRows: PtoRowsSetter;
  setPtoOperRows: PtoRowsSetter;
  setPtoSurveyRows: PtoRowsSetter;
  setPtoManualYears: Dispatch<SetStateAction<string[]>>;
  setExpandedPtoMonths: Dispatch<SetStateAction<Record<string, boolean>>>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  databaseConfigured: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  requestPtoDatabaseSave: () => void;
  addAdminLog: AddAdminLog;
};

export function useAppPtoSupplementalTables({
  isPtoBucketsSection,
  allPtoDateRows,
  deferredVehicleRows,
  ptoTab,
  ptoPlanYear,
  ptoAreaFilter,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoBucketManualRows,
  ptoPlanImportInputRef,
  setPtoPlanRows,
  setPtoOperRows,
  setPtoSurveyRows,
  setPtoManualYears,
  setExpandedPtoMonths,
  setPtoBucketValues,
  setPtoBucketManualRows,
  databaseConfigured,
  ptoDatabaseLoadedRef,
  requestPtoDatabaseSave,
  addAdminLog,
}: UseAppPtoSupplementalTablesOptions) {
  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active: isPtoBucketsSection,
    allPtoDateRows,
    manualRows: ptoBucketManualRows,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
  });

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

  const {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  } = usePtoBucketsEditor({
    ptoAreaFilter,
    ptoBucketRows,
    ptoBucketColumns,
    ptoBucketManualRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    ptoBucketRows,
    ptoBucketColumns,
    openPtoDateImportFilePicker,
    currentPtoDateExcelMeta,
    exportPtoDateTableToExcel,
    importPtoDateTableFromExcel,
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  };
}
