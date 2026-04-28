"use client";

import { useCallback } from "react";
import { restoreAppUndoSnapshot, type AppUndoSnapshot } from "./appUndoSnapshots";
import type { AppUndoHistoryOptions } from "./appUndoHistoryTypes";

type UseAppUndoRestoreOptions = Pick<
  AppUndoHistoryOptions,
  | "databaseConfigured"
  | "ptoDatabaseLoadedRef"
  | "setPtoSaveRevision"
  | "addAdminLog"
  | "setReportCustomers"
  | "setReportAreaOrder"
  | "setReportWorkOrder"
  | "setReportHeaderLabels"
  | "setReportColumnWidths"
  | "setReportReasons"
  | "setAreaShiftCutoffs"
  | "setCustomTabs"
  | "setTopTabs"
  | "setSubTabs"
  | "setVehicleRows"
  | "setPtoManualYears"
  | "setExpandedPtoMonths"
  | "setPtoPlanRows"
  | "setPtoSurveyRows"
  | "setPtoOperRows"
  | "setPtoColumnWidths"
  | "setPtoRowHeights"
  | "setPtoHeaderLabels"
  | "setPtoBucketValues"
  | "setPtoBucketManualRows"
  | "setOrgMembers"
  | "setDependencyNodes"
  | "setDependencyLinks"
  | "setEditingVehicleCell"
  | "setVehicleCellDraft"
  | "setVehicleCellInitialDraft"
  | "setPtoInlineEditCell"
  | "setPtoInlineEditInitialDraft"
  | "setPtoFormulaDraft"
  | "setEditingPtoHeaderKey"
  | "setPtoHeaderDraft"
  | "setEditingReportHeaderKey"
  | "setReportHeaderDraft"
  | "setOpenVehicleFilter"
>;

export function useAppUndoRestore(options: UseAppUndoRestoreOptions) {
  return useCallback((snapshot: AppUndoSnapshot) => {
    restoreAppUndoSnapshot(snapshot, options);
  }, [options]);
}
