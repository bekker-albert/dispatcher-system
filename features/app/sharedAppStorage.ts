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

export type SharedAppStorageSerializationCache = {
  writtenByKey: Record<string, string>;
  serializedByKey: Record<string, string>;
  refsByKey: Record<string, unknown>;
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

export function createSharedAppStorageSerializationCache(
  writtenByKey: Record<string, string> = {},
): SharedAppStorageSerializationCache {
  return {
    writtenByKey: { ...writtenByKey },
    serializedByKey: { ...writtenByKey },
    refsByKey: {},
  };
}

export function serializeSharedAppState(
  state: SharedAppStorageState,
  cache?: SharedAppStorageSerializationCache,
) {
  return Object.fromEntries(
    sharedAppStateEntries.map(([storageKey, stateKey]) => {
      const value = state[stateKey];
      if (
        cache &&
        cache.refsByKey[storageKey] === value &&
        cache.serializedByKey[storageKey] !== undefined
      ) {
        return [storageKey, cache.serializedByKey[storageKey]] as const;
      }

      const serialized = stringifyStorageValue(value);
      if (cache) {
        cache.refsByKey[storageKey] = value;
        cache.serializedByKey[storageKey] = serialized;
      }
      return [storageKey, serialized] as const;
    }),
  );
}

export function parseSharedAppSettingsFromSerializedStorage(
  storage: Record<string, string>,
  keys: readonly string[] = sharedAppSettingKeys,
) {
  return Object.fromEntries(
    keys.flatMap((key) => {
      if (!sharedAppSettingKeys.includes(key)) return [];

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
  cache?: SharedAppStorageSerializationCache,
): SharedAppStorageWriteResult {
  const storage = serializeSharedAppState(state, cache);
  const changedKeys: string[] = [];
  const failedLocalKeys: string[] = [];

  for (const [storageKey] of sharedAppStateEntries) {
    const serialized = storage[storageKey];
    if (cache?.writtenByKey[storageKey] === serialized) continue;

    try {
      window.localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn("Shared app local storage write failed:", storageKey, error);
      failedLocalKeys.push(storageKey);
    }

    if (cache && !failedLocalKeys.includes(storageKey)) {
      cache.writtenByKey[storageKey] = serialized;
    }
    changedKeys.push(storageKey);
  }

  if (changedKeys.length > 0) {
    const updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(adminStorageKeys.appSettingsLocalUpdatedAt, updatedAt);
      window.localStorage.setItem(adminStorageKeys.appStateLocalUpdatedAt, updatedAt);
      window.localStorage.setItem(adminStorageKeys.appLocalUpdatedAt, updatedAt);
    } catch (error) {
      console.warn("Shared app local timestamp write failed:", error);
      failedLocalKeys.push(adminStorageKeys.appSettingsLocalUpdatedAt);
      failedLocalKeys.push(adminStorageKeys.appStateLocalUpdatedAt);
      failedLocalKeys.push(adminStorageKeys.appLocalUpdatedAt);
    }
  }

  return {
    storage,
    settings: parseSharedAppSettingsFromSerializedStorage(storage, changedKeys),
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
