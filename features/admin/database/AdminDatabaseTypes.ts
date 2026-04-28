import type { DataClientSnapshot } from "@/lib/data/app-state";

export type ClientSnapshotStats = {
  appKeys: number;
  ptoRows: number;
  vehicles: number;
  bucketValues: number;
};

export type SnapshotStatsGetter = (snapshot: DataClientSnapshot) => ClientSnapshotStats;
