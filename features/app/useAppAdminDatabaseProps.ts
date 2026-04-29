"use client";

import { useCallback, useMemo } from "react";
import type { DataClientSnapshot } from "@/lib/data/app-state";
import { dataProviderLabel } from "@/lib/data/config";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { clientSnapshotStats } from "@/lib/storage/client-snapshots";
import type { AdminDatabaseSectionProps } from "@/features/admin/database/AdminDatabaseSection";

type UseAppAdminDatabasePropsOptions = {
  active: boolean;
  databaseConfigured: boolean;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  ptoBucketManualRows: PtoBucketRow[];
  ptoBucketValues: Record<string, number>;
  vehicleRows: VehicleRow[];
  clientSnapshots: DataClientSnapshot[];
  databasePanelMessage: string;
  databasePanelLoading: boolean;
  createClientSnapshotNow: () => void;
  refreshClientSnapshots: () => void;
  restoreClientSnapshot: (snapshot: DataClientSnapshot) => void;
};

export function useAppAdminDatabaseProps({
  active,
  databaseConfigured,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  ptoBucketManualRows,
  ptoBucketValues,
  vehicleRows,
  clientSnapshots,
  databasePanelMessage,
  databasePanelLoading,
  createClientSnapshotNow,
  refreshClientSnapshots,
  restoreClientSnapshot,
}: UseAppAdminDatabasePropsOptions): AdminDatabaseSectionProps {
  const ptoMemoryTotal = useMemo(() => (
    active
      ? countPtoStateData({
          planRows: ptoPlanRows,
          operRows: ptoOperRows,
          surveyRows: ptoSurveyRows,
          bucketRows: ptoBucketManualRows,
          bucketValues: ptoBucketValues,
        }).total
      : 0
  ), [active, ptoBucketManualRows, ptoBucketValues, ptoOperRows, ptoPlanRows, ptoSurveyRows]);

  const clientSnapshotStatsByKey = useMemo(() => new Map(
    clientSnapshots.map((snapshot) => [snapshot.key, clientSnapshotStats(snapshot)]),
  ), [clientSnapshots]);
  const getSnapshotStats = useCallback((snapshot: DataClientSnapshot) => (
    clientSnapshotStatsByKey.get(snapshot.key) ?? clientSnapshotStats(snapshot)
  ), [clientSnapshotStatsByKey]);

  return {
    databaseConfigured,
    databaseProviderLabel: dataProviderLabel,
    ptoMemoryTotal,
    vehicleCount: vehicleRows.length,
    snapshots: clientSnapshots,
    message: databasePanelMessage,
    loading: databasePanelLoading,
    getSnapshotStats,
    onCreateSnapshot: createClientSnapshotNow,
    onRefreshSnapshots: refreshClientSnapshots,
    onRestoreSnapshot: restoreClientSnapshot,
  };
}
