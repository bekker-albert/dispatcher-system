"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import { usePtoDateExcelTransfer } from "@/features/pto/usePtoDateExcelTransfer";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRowLookupSource } from "@/features/pto/ptoDateLookupModel";

type AddAdminLog = (entry: AdminLogInput) => void;
type PtoRowsSetter = Dispatch<SetStateAction<PtoPlanRow[]>>;

type UseAppPtoSupplementalTablesOptions = {
  isPtoBucketsSection: boolean;
  ptoBucketRowLookupSources: PtoBucketRowLookupSource[];
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
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  requestPtoDatabaseSave: () => void;
  addAdminLog: AddAdminLog;
};

export function useAppPtoSupplementalTables({
  isPtoBucketsSection,
  ptoBucketRowLookupSources,
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
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
  requestPtoDatabaseSave,
  addAdminLog,
}: UseAppPtoSupplementalTablesOptions) {
  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active: isPtoBucketsSection,
    bucketRowSources: ptoBucketRowLookupSources,
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
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
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
