"use client";

import type { DataClientSnapshot } from "@/lib/data/app-state";
import {
  AdminDatabaseHeader,
  AdminDatabaseSnapshotsTable,
  AdminDatabaseStatusCard,
} from "./AdminDatabaseParts";
import { sectionStyle } from "./AdminDatabaseStyles";
import type { ClientSnapshotStats } from "./AdminDatabaseTypes";

export type AdminDatabaseSectionProps = {
  databaseConfigured: boolean;
  databaseProviderLabel: string;
  ptoMemoryTotal: number;
  vehicleCount: number;
  snapshots: DataClientSnapshot[];
  message: string;
  loading: boolean;
  getSnapshotStats: (snapshot: DataClientSnapshot) => ClientSnapshotStats;
  onCreateSnapshot: () => void;
  onRefreshSnapshots: () => void;
  onRestoreSnapshot: (snapshot: DataClientSnapshot) => void;
};

export default function AdminDatabaseSection({
  databaseConfigured,
  databaseProviderLabel,
  ptoMemoryTotal,
  vehicleCount,
  snapshots,
  message,
  loading,
  getSnapshotStats,
  onCreateSnapshot,
  onRefreshSnapshots,
  onRestoreSnapshot,
}: AdminDatabaseSectionProps) {
  return (
    <div style={sectionStyle}>
      <AdminDatabaseHeader
        loading={loading}
        onCreateSnapshot={onCreateSnapshot}
        onRefreshSnapshots={onRefreshSnapshots}
      />

      <AdminDatabaseStatusCard
        databaseConfigured={databaseConfigured}
        databaseProviderLabel={databaseProviderLabel}
        message={message}
        ptoMemoryTotal={ptoMemoryTotal}
        snapshotsCount={snapshots.length}
        vehicleCount={vehicleCount}
      />

      <AdminDatabaseSnapshotsTable
        getSnapshotStats={getSnapshotStats}
        snapshots={snapshots}
        onRestoreSnapshot={onRestoreSnapshot}
      />
    </div>
  );
}
