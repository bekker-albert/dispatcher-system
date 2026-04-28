import { sharedAppSettingKeys } from "../../lib/domain/app/settings";
import { adminStorageKeys } from "../../lib/storage/keys";

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

export type SharedAppStorageWriteResult = {
  storage: Record<string, string>;
  settings: Record<string, unknown>;
  changedKeys: string[];
  failedLocalKeys: string[];
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

function stringifyStorageValue(value: unknown) {
  return JSON.stringify(value) ?? "null";
}

export function serializeSharedAppState(state: SharedAppStorageState) {
  return Object.fromEntries(
    sharedAppStateEntries.map(([storageKey, stateKey]) => [
      storageKey,
      stringifyStorageValue(state[stateKey]),
    ] as const),
  );
}

export function parseSharedAppSettingsFromSerializedStorage(storage: Record<string, string>) {
  return Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => {
      const value = storage[key];
      if (value === undefined) return [];

      try {
        return [[key, JSON.parse(value)] as const];
      } catch {
        return [];
      }
    }),
  );
}

export function writeSharedAppStateToBrowserStorage(
  state: SharedAppStorageState,
  lastSerializedByKey?: Record<string, string>,
): SharedAppStorageWriteResult {
  const storage = serializeSharedAppState(state);
  const changedKeys: string[] = [];
  const failedLocalKeys: string[] = [];

  for (const [storageKey] of sharedAppStateEntries) {
    const serialized = storage[storageKey];
    if (lastSerializedByKey?.[storageKey] === serialized) continue;

    try {
      window.localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn("Shared app local storage write failed:", storageKey, error);
      failedLocalKeys.push(storageKey);
    }

    if (lastSerializedByKey && !failedLocalKeys.includes(storageKey)) {
      lastSerializedByKey[storageKey] = serialized;
    }
    changedKeys.push(storageKey);
  }

  if (changedKeys.length > 0) {
    try {
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, new Date().toISOString());
    } catch (error) {
      console.warn("Shared app local timestamp write failed:", error);
      failedLocalKeys.push(adminStorageKeys.appLocalUpdatedAt);
    }
  }

  return {
    storage,
    settings: parseSharedAppSettingsFromSerializedStorage(storage),
    changedKeys,
    failedLocalKeys,
  };
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
