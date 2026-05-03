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
import {
  saveAppSettingsToSupabaseClient,
  type SupabaseAppSettingsClient,
} from "../lib/supabase/settings";
import { adminStorageKeys } from "../lib/storage/keys";

type AppSettingsRow = {
  key: string;
  value: unknown;
  updated_at?: string | null;
};

type AppSettingsOperationFilter = { name: "in"; column: string; value: unknown[] };
type AppSettingsOperation = {
  kind: "select" | "upsert";
  table: string;
  columns?: string;
  filters?: AppSettingsOperationFilter[];
  options?: unknown;
  records?: AppSettingsRow[];
};

class FakeAppSettingsQuery {
  private readonly filters: AppSettingsOperationFilter[] = [];
  private columns = "";

  constructor(
    private readonly client: FakeAppSettingsClient,
    private readonly table: string,
  ) {}

  select(columns: string) {
    this.columns = columns;
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ name: "in", column, value });
    return this;
  }

  async upsert(records: AppSettingsRow[], options?: unknown) {
    this.client.operations.push({ kind: "upsert", table: this.table, records, options });
    const rowsByKey = new Map(this.client.rows.map((row) => [row.key, row]));
    for (const record of records) {
      rowsByKey.set(record.key, record);
    }
    this.client.rows = Array.from(rowsByKey.values());
    return { error: null };
  }

  then<TResult1 = { data: AppSettingsRow[]; error: null }>(
    onfulfilled?: ((value: { data: AppSettingsRow[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
  ) {
    const inFilter = this.filters.find((filter) => filter.name === "in" && filter.column === "key");
    const rows = inFilter
      ? this.client.rows.filter((row) => inFilter.value.includes(row.key))
      : this.client.rows;

    this.client.operations.push({
      kind: "select",
      table: this.table,
      columns: this.columns,
      filters: this.filters,
    });

    const result = { data: rows, error: null };
    return Promise.resolve(onfulfilled ? onfulfilled(result) : result as TResult1);
  }
}

class FakeAppSettingsClient {
  operations: AppSettingsOperation[] = [];

  constructor(public rows: AppSettingsRow[] = []) {}

  from(table: string) {
    return new FakeAppSettingsQuery(this, table);
  }
}

function fakeAppSettingsClient(rows: AppSettingsRow[] = []) {
  return new FakeAppSettingsClient(rows) as unknown as FakeAppSettingsClient & SupabaseAppSettingsClient;
}

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

{
  const existingRows = [
    { key: adminStorageKeys.reportReasons, value: { row1: "server" }, updated_at: "2026-04-28T02:00:00.000Z" },
  ];
  const client = fakeAppSettingsClient([...existingRows]);

  await assert.rejects(
    saveAppSettingsToSupabaseClient({
      [adminStorageKeys.reportCustomers]: ["new"],
      [adminStorageKeys.reportReasons]: { row1: "local" },
    }, client, {
      expectedUpdatedAt: {
        [adminStorageKeys.reportCustomers]: null,
        [adminStorageKeys.reportReasons]: "2026-04-28T01:00:00.000Z",
      },
    }),
    /App settings changed in another tab: .*dispatcher:report-reasons/,
  );

  assert.equal(client.operations.some((operation) => operation.kind === "upsert"), false);
  assert.deepEqual(client.rows, existingRows);
}

{
  const client = fakeAppSettingsClient([
    { key: adminStorageKeys.reportReasons, value: { row1: "old" }, updated_at: "2026-04-28T01:00:00.000Z" },
  ]);

  const savedRows = await saveAppSettingsToSupabaseClient({
    [adminStorageKeys.reportCustomers]: ["new"],
    [adminStorageKeys.reportReasons]: { row1: "local" },
  }, client, {
    expectedUpdatedAt: {
      [adminStorageKeys.reportCustomers]: null,
      [adminStorageKeys.reportReasons]: "2026-04-28T01:00:00.000Z",
    },
  });

  const upserts = client.operations.filter((operation) => operation.kind === "upsert");
  assert.equal(upserts.length, 1);
  assert.deepEqual(
    upserts[0]?.records?.map(({ key, value }) => ({ key, value })),
    [
      { key: adminStorageKeys.reportCustomers, value: ["new"] },
      { key: adminStorageKeys.reportReasons, value: { row1: "local" } },
    ],
  );
  assert.equal(
    upserts[0]?.records?.every((record) => typeof record.updated_at === "string"),
    true,
  );
  assert.deepEqual(upserts[0]?.options, { onConflict: "key" });
  assert.deepEqual(
    client.operations.map((operation) => operation.kind),
    ["select", "upsert", "select"],
  );
  assert.deepEqual(
    savedRows?.map(({ key, value }) => ({ key, value })),
    [
      { key: adminStorageKeys.reportReasons, value: { row1: "local" } },
      { key: adminStorageKeys.reportCustomers, value: ["new"] },
    ],
  );
}

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
  assert.match(storageWrites[adminStorageKeys.appSettingsLocalUpdatedAt], /^\d{4}-\d{2}-\d{2}T/);
  assert.match(storageWrites[adminStorageKeys.appStateLocalUpdatedAt], /^\d{4}-\d{2}-\d{2}T/);

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
