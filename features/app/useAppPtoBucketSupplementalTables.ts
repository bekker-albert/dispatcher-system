"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";

import { usePtoBucketsEditor } from "@/features/pto/usePtoBucketsEditor";
import { usePtoBucketsViewModel } from "@/features/pto/usePtoBucketsViewModel";
import type { PtoDatabaseInlineSavePatch } from "@/features/pto/ptoPersistenceModel";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { AdminLogInput } from "@/lib/domain/admin/logs";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import type { PtoBucketRowLookupSource } from "@/features/pto/ptoDateLookupModel";
import type { SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type AddAdminLog = (entry: AdminLogInput) => void;
type ShowSaveStatus = (kind: SaveStatusState["kind"], message: string) => void;

type UseAppPtoBucketSupplementalTablesOptions = {
  active: boolean;
  ptoAreaFilter: string;
  ptoBucketRowLookupSources: PtoBucketRowLookupSource[];
  deferredVehicleRows: VehicleRow[];
  ptoBucketManualRows: PtoBucketRow[];
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
  ptoAreaFilter,
  ptoBucketRowLookupSources,
  deferredVehicleRows,
  ptoBucketManualRows,
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
  const {
    ptoBucketRows,
    ptoBucketColumns,
  } = usePtoBucketsViewModel({
    active,
    bucketRowSources: ptoBucketRowLookupSources,
    manualRows: ptoBucketManualRows,
    areaFilter: ptoAreaFilter,
    vehicleRows: deferredVehicleRows,
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
    showSaveStatus,
    requestSave: requestPtoDatabaseSave,
    addAdminLog,
  });

  return {
    ptoBucketRows,
    ptoBucketColumns,
    commitPtoBucketValue,
    clearPtoBucketCells,
    addPtoBucketManualRow,
    deletePtoBucketManualRow,
  };
}
