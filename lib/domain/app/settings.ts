import { adminStorageKeys } from "../../storage/keys";

export const clientSnapshotSaveDelayMs = 1500;
export const clientSnapshotAutoMinIntervalMs = 120000;

export type SaveAppSettingsOptions = {
  expectedUpdatedAt?: Record<string, string | null | undefined>;
};

export const sharedAppSettingKeys = [
  adminStorageKeys.reportCustomers,
  adminStorageKeys.reportAreaOrder,
  adminStorageKeys.reportWorkOrder,
  adminStorageKeys.reportHeaderLabels,
  adminStorageKeys.reportColumnWidths,
  adminStorageKeys.reportReasons,
  adminStorageKeys.customTabs,
  adminStorageKeys.topTabs,
  adminStorageKeys.subTabs,
  adminStorageKeys.dispatchSummaryRows,
  adminStorageKeys.areaShiftCutoffs,
  adminStorageKeys.orgMembers,
  adminStorageKeys.dependencyNodes,
  adminStorageKeys.dependencyLinks,
  adminStorageKeys.adminLogs,
] as const;
