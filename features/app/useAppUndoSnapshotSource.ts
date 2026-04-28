"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  createAppUndoSnapshot,
  type AppUndoSnapshot,
  type AppUndoSnapshotScope,
  type AppUndoSnapshotSource,
} from "./appUndoSnapshots";
import type { AppUndoHistoryOptions } from "./appUndoHistoryTypes";

type UseAppUndoSnapshotSourceOptions = Pick<
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

export function useAppUndoSnapshotSource(options: UseAppUndoSnapshotSourceOptions) {
  const snapshotSourceRef = useRef<AppUndoSnapshotSource | null>(null);

  useEffect(() => {
    snapshotSourceRef.current = options;
  }, [options]);

  return useCallback((scope: AppUndoSnapshotScope = "all"): AppUndoSnapshot => {
    const source = snapshotSourceRef.current;
    if (!source) {
      throw new Error("App undo snapshot source is not ready.");
    }

    return createAppUndoSnapshot(source, scope);
  }, []);
}
