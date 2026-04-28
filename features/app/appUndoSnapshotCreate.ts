import type { UndoSnapshot } from "../../lib/domain/app/undo";
import type {
  AppUndoSnapshot,
  AppUndoSnapshotReferenceSignature,
  AppUndoSnapshotScope,
  AppUndoSnapshotSource,
} from "./appUndoSnapshotTypes";

export function createAppUndoSnapshot({
  reportCustomers,
  reportAreaOrder,
  reportWorkOrder,
  reportHeaderLabels,
  reportColumnWidths,
  reportReasons,
  areaShiftCutoffs,
  customTabs,
  topTabs,
  subTabs,
  ptoManualYears,
  expandedPtoMonths,
  ptoPlanRows,
  ptoSurveyRows,
  ptoOperRows,
  ptoColumnWidths,
  ptoRowHeights,
  ptoHeaderLabels,
  ptoBucketValues,
  ptoBucketManualRows,
  orgMembers,
  dependencyNodes,
  dependencyLinks,
}: AppUndoSnapshotSource, scope: AppUndoSnapshotScope = "all"): AppUndoSnapshot {
  const snapshot: AppUndoSnapshot = {};
  const includeReports = scope === "all" || scope === "reports";
  const includePto = scope === "all" || scope === "pto";
  const includeAdmin = scope === "all" || scope === "admin";
  const includeNavigation = scope === "all" || scope === "navigation";

  if (includeReports) {
    Object.assign(snapshot, {
      reportCustomers,
      reportAreaOrder,
      reportWorkOrder,
      reportHeaderLabels,
      reportColumnWidths,
      reportReasons,
      areaShiftCutoffs,
    });
  }

  if (includeNavigation) {
    Object.assign(snapshot, {
      customTabs,
      topTabs,
      subTabs,
    });
  }

  if (includePto) {
    Object.assign(snapshot, {
      ptoManualYears,
      expandedPtoMonths,
      ptoPlanRows,
      ptoSurveyRows,
      ptoOperRows,
      ptoColumnWidths,
      ptoRowHeights,
      ptoHeaderLabels,
      ptoBucketValues,
      ptoBucketManualRows,
    });
  }

  if (includeAdmin) {
    Object.assign(snapshot, {
      areaShiftCutoffs,
      orgMembers,
      dependencyNodes,
      dependencyLinks,
    });
  }

  return snapshot;
}

export function cloneAppUndoSnapshot(snapshot: AppUndoSnapshot): AppUndoSnapshot {
  if (typeof structuredClone === "function") {
    return structuredClone(snapshot) as AppUndoSnapshot;
  }

  return JSON.parse(JSON.stringify(snapshot)) as AppUndoSnapshot;
}

export function appUndoSnapshotReferenceSignature(snapshot: AppUndoSnapshot): AppUndoSnapshotReferenceSignature {
  return Object.fromEntries(
    (Object.keys(snapshot) as Array<keyof UndoSnapshot>).map((key) => [key, snapshot[key]]),
  ) as AppUndoSnapshotReferenceSignature;
}

export function appUndoSnapshotReferencesEqual(
  left: AppUndoSnapshotReferenceSignature | null,
  right: AppUndoSnapshotReferenceSignature,
) {
  if (!left) return false;

  const leftKeys = Object.keys(left) as Array<keyof UndoSnapshot>;
  const rightKeys = Object.keys(right) as Array<keyof UndoSnapshot>;
  if (leftKeys.length !== rightKeys.length) return false;

  return rightKeys.every((key) => Object.is(left[key], right[key]));
}
