import { cloneVehicleRows } from "../../lib/domain/vehicles/filtering";
import type {
  AppUndoSnapshot,
  AppUndoSnapshotRestoreTarget,
} from "./appUndoSnapshotTypes";

function snapshotHasAnyPtoKey(snapshot: AppUndoSnapshot) {
  return [
    "ptoManualYears",
    "expandedPtoMonths",
    "ptoPlanRows",
    "ptoSurveyRows",
    "ptoOperRows",
    "ptoColumnWidths",
    "ptoRowHeights",
    "ptoHeaderLabels",
    "ptoBucketValues",
    "ptoBucketManualRows",
  ].some((key) => key in snapshot);
}

function clearActiveEditors({
  setEditingVehicleCell,
  setVehicleCellDraft,
  setVehicleCellInitialDraft,
  setPtoInlineEditCell,
  setPtoInlineEditInitialDraft,
  setPtoFormulaDraft,
  setEditingPtoHeaderKey,
  setPtoHeaderDraft,
  setEditingReportHeaderKey,
  setReportHeaderDraft,
  setOpenVehicleFilter,
}: AppUndoSnapshotRestoreTarget) {
  setEditingVehicleCell(null);
  setVehicleCellDraft("");
  setVehicleCellInitialDraft("");
  setPtoInlineEditCell(null);
  setPtoInlineEditInitialDraft("");
  setPtoFormulaDraft("");
  setEditingPtoHeaderKey(null);
  setPtoHeaderDraft("");
  setEditingReportHeaderKey(null);
  setReportHeaderDraft("");
  setOpenVehicleFilter(null);
}

export function restoreAppUndoSnapshot(snapshot: AppUndoSnapshot, target: AppUndoSnapshotRestoreTarget) {
  if ("reportCustomers" in snapshot) target.setReportCustomers(snapshot.reportCustomers!);
  if ("reportAreaOrder" in snapshot) target.setReportAreaOrder(snapshot.reportAreaOrder!);
  if ("reportWorkOrder" in snapshot) target.setReportWorkOrder(snapshot.reportWorkOrder!);
  if ("reportHeaderLabels" in snapshot) target.setReportHeaderLabels(snapshot.reportHeaderLabels!);
  if ("reportColumnWidths" in snapshot) target.setReportColumnWidths(snapshot.reportColumnWidths!);
  if ("reportReasons" in snapshot) target.setReportReasons(snapshot.reportReasons!);
  if ("areaShiftCutoffs" in snapshot) target.setAreaShiftCutoffs(snapshot.areaShiftCutoffs!);
  if ("customTabs" in snapshot) target.setCustomTabs(snapshot.customTabs!);
  if ("topTabs" in snapshot) target.setTopTabs(snapshot.topTabs!);
  if ("subTabs" in snapshot) target.setSubTabs(snapshot.subTabs!);
  if (snapshot.vehicleRows) {
    target.setVehicleRows(cloneVehicleRows(snapshot.vehicleRows));
  }
  if ("ptoManualYears" in snapshot) target.setPtoManualYears(snapshot.ptoManualYears!);
  if ("expandedPtoMonths" in snapshot) target.setExpandedPtoMonths(snapshot.expandedPtoMonths!);
  if ("ptoPlanRows" in snapshot) target.setPtoPlanRows(snapshot.ptoPlanRows!);
  if ("ptoSurveyRows" in snapshot) target.setPtoSurveyRows(snapshot.ptoSurveyRows!);
  if ("ptoOperRows" in snapshot) target.setPtoOperRows(snapshot.ptoOperRows!);
  if ("ptoColumnWidths" in snapshot) target.setPtoColumnWidths(snapshot.ptoColumnWidths!);
  if ("ptoRowHeights" in snapshot) target.setPtoRowHeights(snapshot.ptoRowHeights!);
  if ("ptoHeaderLabels" in snapshot) target.setPtoHeaderLabels(snapshot.ptoHeaderLabels!);
  if ("ptoBucketValues" in snapshot) target.setPtoBucketValues(snapshot.ptoBucketValues!);
  if ("ptoBucketManualRows" in snapshot) target.setPtoBucketManualRows(snapshot.ptoBucketManualRows!);
  if ("orgMembers" in snapshot) target.setOrgMembers(snapshot.orgMembers!);
  if ("dependencyNodes" in snapshot) target.setDependencyNodes(snapshot.dependencyNodes!);
  if ("dependencyLinks" in snapshot) target.setDependencyLinks(snapshot.dependencyLinks!);

  clearActiveEditors(target);

  if (snapshotHasAnyPtoKey(snapshot) && target.databaseConfigured && target.ptoDatabaseLoadedRef.current) {
    target.setPtoSaveRevision((revision) => revision + 1);
  }

  target.addAdminLog({
    action: "Отмена",
    section: "Система",
    details: "Выполнен возврат на шаг назад через Ctrl+Z.",
  });
}
