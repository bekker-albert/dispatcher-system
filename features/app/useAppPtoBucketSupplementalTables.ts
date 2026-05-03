"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import { usePtoBodiesViewModel } from "@/features/pto/usePtoBodiesViewModel";
import { usePtoMatrixExcelTransfer } from "@/features/pto/usePtoMatrixExcelTransfer";
import { usePtoPerformanceViewModel } from "@/features/pto/usePtoPerformanceViewModel";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";
import { createPtoCycleColumns } from "@/lib/domain/pto/cycle";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { ptoMatrixTableMetaFor } from "@/lib/domain/pto/tabs";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRowLookupSource } from "@/features/pto/ptoDateLookupModel";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type AddAdminLog = (entry: AdminLogInput) => void;
type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type UseAppPtoBucketSupplementalTablesOptions = {
  active: boolean;
  ptoTab: string;
  ptoAreaFilter: string;
  ptoBucketRowLookupSources: PtoBucketRowLookupSource[];
  ptoPerformanceRowSources: PtoPlanRow[];
  deferredVehicleRows: VehicleRow[];
  ptoBucketManualRows: PtoBucketRow[];
  ptoBucketValues: Record<string, number>;
  setPtoBucketValues: Dispatch<SetStateAction<Record<string, number>>>;
  setPtoBucketManualRows: Dispatch<SetStateAction<PtoBucketRow[]>>;
  databaseConfigured: boolean;
  ptoDatabaseLoadedRef: RefObject<boolean>;
  markPtoDatabaseInlineWriteSaved: (updatedAt?: string | null, patch?: PtoDatabaseInlineSavePatch) => void;
  getPtoDatabaseExpectedUpdatedAt: () => string | null;
  requestPtoDatabaseSave: () => void;
  showSaveStatus: ShowSaveStatus;
  addAdminLog: AddAdminLog;
};

export function useAppPtoBucketSupplementalTables({
  active,
  ptoTab,
  ptoAreaFilter,
  ptoBucketRowLookupSources,
  ptoPerformanceRowSources,
  deferredVehicleRows,
  ptoBucketManualRows,
  ptoBucketValues,
  setPtoBucketValues,
  setPtoBucketManualRows,
  databaseConfigured,
  ptoDatabaseLoadedRef,
  markPtoDatabaseInlineWriteSaved,
  getPtoDatabaseExpectedUpdatedAt,
  requestPtoDatabaseSave,
  showSaveStatus,
  addAdminLog,
}: UseAppPtoBucketSupplementalTablesOptions) {
  const bucketsActive = active && ptoTab === "buckets";
  const cycleActive = active && ptoTab === "cycle";
  const bodiesActive = active && ptoTab === "bodies";
  const performanceActive = active && ptoTab === "performance";
  const matrixTableMeta = ptoMatrixTableMetaFor(ptoTab);
  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active: bucketsActive || cycleActive,
    bucketRowSources: ptoBucketRowLookupSources,
    manualRows: ptoBucketManualRows,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
  });
  const ptoCycleRows = cycleActive ? ptoBucketRows : [];
  const ptoCycleColumns = cycleActive ? createPtoCycleColumns(deferredVehicleRows) : [];
  const {
    ptoBodyRows,
    ptoBodyColumns,
  } = usePtoBodiesViewModel({
    active: bodiesActive,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
  });
  const {
    ptoPerformanceRows,
    ptoPerformanceColumns,
  } = usePtoPerformanceViewModel({
    active: performanceActive,
    areaFilter: ptoAreaFilter,
    sourceRows: ptoPerformanceRowSources,
  });
  const editableRows = performanceActive
    ? ptoPerformanceRows
    : bodiesActive
      ? ptoBodyRows
      : cycleActive
        ? ptoCycleRows
        : ptoBucketRows;
  const editableColumns = performanceActive
    ? ptoPerformanceColumns
    : bodiesActive
      ? ptoBodyColumns
      : cycleActive
        ? ptoCycleColumns
        : ptoBucketColumns;
  const {
    sectionLabel,
    valueLabel,
    excelFileName,
  } = matrixTableMeta;

  const {
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  } = usePtoBucketsEditor({
    ptoAreaFilter,
    ptoBucketRows: editableRows,
    ptoBucketColumns: editableColumns,
    ptoBucketManualRows,
    setPtoBucketValues,
    setPtoBucketManualRows,
    databaseConfigured,
    ptoDatabaseLoadedRef,
    markPtoDatabaseInlineWriteSaved,
    getPtoDatabaseExpectedUpdatedAt,
    showSaveStatus,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
    sectionLabel,
    valueLabel,
  });
  const {
    exportMatrixToExcel,
    importMatrixFromExcel,
  } = usePtoMatrixExcelTransfer({
    rows: editableRows,
    columns: editableColumns,
    values: ptoBucketValues,
    setValues: setPtoBucketValues,
    sectionLabel,
    fileName: excelFileName,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    ptoBucketRows,
    ptoBucketColumns,
    ptoCycleRows,
    ptoCycleColumns,
    ptoBodyRows,
    ptoBodyColumns,
    ptoPerformanceRows,
    ptoPerformanceColumns,
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
    exportPtoMatrixToExcel: exportMatrixToExcel,
    importPtoMatrixFromExcel: importMatrixFromExcel,
  };
}
