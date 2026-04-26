"use client";

import type { DataClientSnapshot } from "@/lib/data/app-state";
import { dataProviderLabel } from "@/lib/data/config";
import { countPtoStateData } from "@/lib/domain/pto/state-stats";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { clientSnapshotStats } from "@/lib/storage/client-snapshots";
import type { AdminDatabaseSectionProps } from "@/features/admin/database/AdminDatabaseSection";

type UseAppAdminDatabasePropsOptions = {
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
  return {
    databaseConfigured,
    databaseProviderLabel: dataProviderLabel,
    ptoMemoryTotal: countPtoStateData({
      planRows: ptoPlanRows,
      operRows: ptoOperRows,
      surveyRows: ptoSurveyRows,
      bucketRows: ptoBucketManualRows,
      bucketValues: ptoBucketValues,
    }).total,
    vehicleCount: vehicleRows.length,
    snapshots: clientSnapshots,
    message: databasePanelMessage,
    loading: databasePanelLoading,
    getSnapshotStats: clientSnapshotStats,
    onCreateSnapshot: createClientSnapshotNow,
    onRefreshSnapshots: refreshClientSnapshots,
    onRestoreSnapshot: restoreClientSnapshot,
  };
}
