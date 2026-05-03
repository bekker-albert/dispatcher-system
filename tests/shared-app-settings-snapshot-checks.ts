import assert from "node:assert/strict";
import {
  applySavedSharedAppSettingsToSnapshot,
  createSharedAppSettingsDatabaseSnapshot,
  createSharedAppSettingsSaveDelta,
  parseSharedAppSettingsDatabaseSnapshot,
  serializeSharedAppSettingsDatabaseSnapshot,
} from "../lib/domain/app/shared-settings-snapshot";
import {
  createSharedAppStorageSerializationCache,
  parseSharedAppSettingsFromSerializedStorage,
  type SharedAppStorageState,
  writeSharedAppStateToBrowserStorage,
} from "../features/app/sharedAppStorage";
import { adminStorageKeys } from "../lib/storage/keys";

assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot(""), { values: {}, updatedAtByKey: {} });
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot("{bad"), { values: {}, updatedAtByKey: {} });
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot("[]"), { values: {}, updatedAtByKey: {} });
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot("7"), { values: {}, updatedAtByKey: {} });

const legacySnapshot = JSON.stringify({
  [adminStorageKeys.reportCustomers]: ["old"],
  unknown_key: "ignored",
});
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot(legacySnapshot), {
  values: {
    [adminStorageKeys.reportCustomers]: ["old"],
  },
  updatedAtByKey: {},
});

const formattedSnapshot = serializeSharedAppSettingsDatabaseSnapshot({
  values: {
    [adminStorageKeys.reportCustomers]: ["old"],
    unknown_key: "ignored",
  },
  updatedAtByKey: {
    [adminStorageKeys.reportCustomers]: "2026-04-28T01:00:00.000Z",
    [adminStorageKeys.reportReasons]: null,
    unknown_key: "ignored",
  },
});
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot(formattedSnapshot), {
  values: {
    [adminStorageKeys.reportCustomers]: ["old"],
  },
  updatedAtByKey: {
    [adminStorageKeys.reportCustomers]: "2026-04-28T01:00:00.000Z",
    [adminStorageKeys.reportReasons]: null,
  },
});

const recordsSnapshot = createSharedAppSettingsDatabaseSnapshot([
  { key: adminStorageKeys.reportCustomers, value: ["old"], updated_at: "2026-04-28T01:00:00.000Z" },
  { key: adminStorageKeys.reportReasons, value: { row1: "same" }, updated_at: "2026-04-28T01:01:00.000Z" },
  { key: "unknown_key", value: "ignored", updated_at: "2026-04-28T01:02:00.000Z" },
]);
assert.deepEqual(createSharedAppSettingsSaveDelta({
  [adminStorageKeys.reportCustomers]: ["new"],
  [adminStorageKeys.reportReasons]: { row1: "same" },
}, recordsSnapshot), {
  settings: {
    [adminStorageKeys.reportCustomers]: ["new"],
  },
  expectedUpdatedAt: {
    [adminStorageKeys.reportCustomers]: "2026-04-28T01:00:00.000Z",
  },
});

assert.deepEqual(parseSharedAppSettingsFromSerializedStorage({
  [adminStorageKeys.reportCustomers]: "[\"new\"]",
  [adminStorageKeys.reportReasons]: "{\"row1\":\"same\"}",
}, [adminStorageKeys.reportReasons]), {
  [adminStorageKeys.reportReasons]: { row1: "same" },
});

const updatedSnapshot = applySavedSharedAppSettingsToSnapshot(recordsSnapshot, [
  { key: adminStorageKeys.reportCustomers, value: ["new"], updated_at: "2026-04-28T02:00:00.000Z" },
  { key: "unknown_key", value: "ignored after serialize", updated_at: "2026-04-28T02:01:00.000Z" },
]);
assert.deepEqual(parseSharedAppSettingsDatabaseSnapshot(updatedSnapshot), {
  values: {
    [adminStorageKeys.reportCustomers]: ["new"],
    [adminStorageKeys.reportReasons]: { row1: "same" },
  },
  updatedAtByKey: {
    [adminStorageKeys.reportCustomers]: "2026-04-28T02:00:00.000Z",
    [adminStorageKeys.reportReasons]: "2026-04-28T01:01:00.000Z",
  },
});

const sharedStateFixture: SharedAppStorageState = {
  reportCustomers: [{ id: "aam" }],
  reportAreaOrder: ["Аксу"],
  reportWorkOrder: {},
  reportHeaderLabels: {},
  reportColumnWidths: {},
  reportReasons: {},
  areaShiftCutoffs: {},
  customTabs: [],
  topTabs: [],
  subTabs: {},
  dispatchSummaryRows: [],
  orgMembers: [],
  dependencyNodes: [],
  dependencyLinks: [],
  adminLogs: [],
};
const storageWrites: Record<string, string> = {};
const testGlobal = globalThis as typeof globalThis & { window?: unknown };
const originalWindow = testGlobal.window;

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: {
      setItem(key: string, value: string) {
        storageWrites[key] = value;
      },
      getItem(key: string) {
        return storageWrites[key] ?? null;
      },
    },
  },
});

try {
  const cache = createSharedAppStorageSerializationCache();
  const firstWrite = writeSharedAppStateToBrowserStorage(sharedStateFixture, cache);
  assert.ok(firstWrite.changedKeys.includes(adminStorageKeys.reportCustomers));
  assert.equal(storageWrites[adminStorageKeys.reportCustomers], JSON.stringify(sharedStateFixture.reportCustomers));

  for (const key of Object.keys(storageWrites)) delete storageWrites[key];

  const secondWrite = writeSharedAppStateToBrowserStorage(sharedStateFixture, cache);
  assert.deepEqual(secondWrite.changedKeys, []);
  assert.deepEqual(storageWrites, {});
} finally {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
}
