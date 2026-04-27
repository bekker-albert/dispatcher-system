import { sharedAppSettingKeys } from "@/lib/domain/app/settings";
import { adminStorageKeys } from "@/lib/storage/keys";

export type SharedAppStorageState = {
  reportCustomers: unknown;
  reportAreaOrder: unknown;
  reportWorkOrder: unknown;
  reportHeaderLabels: unknown;
  reportColumnWidths: unknown;
  reportReasons: unknown;
  areaShiftCutoffs: unknown;
  customTabs: unknown;
  topTabs: unknown;
  subTabs: unknown;
  dispatchSummaryRows: unknown;
  orgMembers: unknown;
  dependencyNodes: unknown;
  dependencyLinks: unknown;
  adminLogs: unknown;
};

const sharedAppStateEntries = [
  [adminStorageKeys.reportCustomers, "reportCustomers"],
  [adminStorageKeys.reportAreaOrder, "reportAreaOrder"],
  [adminStorageKeys.reportWorkOrder, "reportWorkOrder"],
  [adminStorageKeys.reportHeaderLabels, "reportHeaderLabels"],
  [adminStorageKeys.reportColumnWidths, "reportColumnWidths"],
  [adminStorageKeys.reportReasons, "reportReasons"],
  [adminStorageKeys.areaShiftCutoffs, "areaShiftCutoffs"],
  [adminStorageKeys.customTabs, "customTabs"],
  [adminStorageKeys.topTabs, "topTabs"],
  [adminStorageKeys.subTabs, "subTabs"],
  [adminStorageKeys.dispatchSummaryRows, "dispatchSummaryRows"],
  [adminStorageKeys.orgMembers, "orgMembers"],
  [adminStorageKeys.dependencyNodes, "dependencyNodes"],
  [adminStorageKeys.dependencyLinks, "dependencyLinks"],
  [adminStorageKeys.adminLogs, "adminLogs"],
] as const satisfies ReadonlyArray<readonly [string, keyof SharedAppStorageState]>;

export function writeSharedAppStateToBrowserStorage(state: SharedAppStorageState) {
  for (const [storageKey, stateKey] of sharedAppStateEntries) {
    window.localStorage.setItem(storageKey, JSON.stringify(state[stateKey]));
  }
  window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
}

export function collectSharedAppStorageFromBrowserStorage() {
  return Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => {
      const value = window.localStorage.getItem(key);
      return value === null ? [] : [[key, value] as const];
    }),
  );
}

export function collectSharedAppSettingsFromBrowserStorage() {
  return Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => {
      const value = window.localStorage.getItem(key);
      if (value === null) return [];

      try {
        return [[key, JSON.parse(value)] as const];
      } catch {
        return [];
      }
    }),
  );
}
