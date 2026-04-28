import type { UndoSnapshot } from "../../lib/domain/app/undo";
import type { AppUndoHistoryOptions } from "./appUndoHistoryTypes";

export type AppUndoSnapshotScope = "all" | "reports" | "pto" | "admin" | "navigation";
export type AppUndoSnapshot = Partial<UndoSnapshot>;

export type AppUndoSnapshotSource = Pick<
  AppUndoHistoryOptions,
  | "reportCustomers"
  | "reportAreaOrder"
  | "reportWorkOrder"
  | "reportHeaderLabels"
  | "reportColumnWidths"
  | "reportReasons"
  | "areaShiftCutoffs"
  | "customTabs"
  | "topTabs"
  | "subTabs"
  | "ptoManualYears"
  | "expandedPtoMonths"
  | "ptoPlanRows"
  | "ptoSurveyRows"
  | "ptoOperRows"
  | "ptoColumnWidths"
  | "ptoRowHeights"
  | "ptoHeaderLabels"
  | "ptoBucketValues"
  | "ptoBucketManualRows"
  | "orgMembers"
  | "dependencyNodes"
  | "dependencyLinks"
>;

export type AppUndoSnapshotRestoreTarget = Pick<
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

export type AppUndoSnapshotReferenceSignature = Partial<Record<keyof UndoSnapshot, unknown>>;
