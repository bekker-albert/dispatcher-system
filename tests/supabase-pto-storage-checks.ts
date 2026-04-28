import assert from "node:assert/strict";
import {
  savePtoStateToSupabaseClient,
  type SupabasePtoState,
} from "../lib/supabase/pto";
import {
  ptoBucketRowsTable,
  ptoBucketValuesTable,
  ptoDayValuesTable,
  ptoRowsTable,
  ptoSettingsTable,
  type SupabasePtoClient,
} from "../lib/supabase/pto-storage";

type Operation = {
  kind: "upsert" | "select" | "delete";
  table: string;
  rows?: number;
  filters?: OperationFilter[];
};

type OperationFilter = { name: string; column: string; value: unknown };

class FakeSupabaseQuery {
  private readonly filters: OperationFilter[] = [];
  private deleteOperation: Operation | null = null;

  constructor(
    private readonly client: FakeSupabaseClient,
    private readonly table: string,
  ) {}

  async upsert(records: unknown[]) {
    this.client.operations.push({ kind: "upsert", table: this.table, rows: records.length });
    if (this.client.failUpsertTable === this.table) {
      return { error: new Error(`Injected upsert failure for ${this.table}`) };
    }
    return { error: null };
  }

  select() {
    return this;
  }

  order() {
    return this;
  }

  async range(from: number, to: number) {
    const rows = this.client.rowsByTable[this.table] ?? [];
    this.client.operations.push({ kind: "select", table: this.table });
    return { data: rows.slice(from, to + 1), error: null };
  }

  delete() {
    this.deleteOperation = { kind: "delete", table: this.table, filters: this.filters };
    this.client.operations.push(this.deleteOperation);
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ name: "eq", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ name: "in", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ name: "gte", column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ name: "lte", column, value });
    return this;
  }

  then<TResult1 = { error: null }>(
    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
  ) {
    const result = { data: this.client.rowsByTable[this.table] ?? [], error: null };
    return Promise.resolve(onfulfilled ? onfulfilled(result) : result as TResult1);
  }
}

class FakeSupabaseClient {
  operations: Operation[] = [];
  failUpsertTable: string | null = null;
  rowsByTable: Record<string, unknown[]> = {
    [ptoRowsTable]: [],
    [ptoDayValuesTable]: [],
    [ptoBucketRowsTable]: [],
    [ptoBucketValuesTable]: [],
    [ptoSettingsTable]: [],
  };

  from(table: string) {
    return new FakeSupabaseQuery(this, table);
  }
}

function createState(): SupabasePtoState {
  return {
    manualYears: ["2026"],
    planRows: [{
      id: "plan-keep",
      area: "Aksu",
      location: "",
      structure: "Work",
      customerCode: "AAM",
      unit: "m3",
      status: "Active",
      carryover: 0,
      dailyPlans: { "2026-04-01": 10 },
      years: ["2026"],
    }],
    operRows: [],
    surveyRows: [],
    bucketRows: [{ key: "bucket-keep", area: "Aksu", structure: "Work", source: "manual" }],
    bucketValues: { "bucket-keep::excavator": 2 },
    uiState: { ptoTab: "plan" },
  };
}

function createClient() {
  const client = new FakeSupabaseClient();
  client.rowsByTable = {
    [ptoRowsTable]: [
      { table_type: "plan", row_id: "plan-keep" },
      { table_type: "plan", row_id: "plan-stale" },
    ],
    [ptoDayValuesTable]: [
      { table_type: "plan", row_id: "plan-keep", work_date: "2026-04-01", value: 10 },
      { table_type: "plan", row_id: "plan-keep", work_date: "2026-04-02", value: 5 },
    ],
    [ptoBucketRowsTable]: [
      { row_key: "bucket-keep" },
      { row_key: "bucket-stale" },
    ],
    [ptoBucketValuesTable]: [
      { row_key: "bucket-keep", equipment_key: "excavator", value: 2 },
      { row_key: "bucket-keep", equipment_key: "loader", value: 4 },
    ],
    [ptoSettingsTable]: [],
  };
  return client;
}

function operationIndex(operations: Operation[], kind: Operation["kind"], table: string) {
  const index = operations.findIndex((operation) => operation.kind === kind && operation.table === table);
  assert.notEqual(index, -1, `${kind} ${table} was not called`);
  return index;
}

{
  const client = createClient();
  await savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient);

  const operations = client.operations;
  const writeIndexes = [
    operationIndex(operations, "upsert", ptoRowsTable),
    operationIndex(operations, "upsert", ptoDayValuesTable),
    operationIndex(operations, "upsert", ptoBucketRowsTable),
    operationIndex(operations, "upsert", ptoBucketValuesTable),
    operationIndex(operations, "upsert", ptoSettingsTable),
  ];
  const firstCleanupIndex = Math.min(
    operationIndex(operations, "select", ptoDayValuesTable),
    operationIndex(operations, "select", ptoRowsTable),
    operationIndex(operations, "select", ptoBucketValuesTable),
    operationIndex(operations, "select", ptoBucketRowsTable),
  );

  assert.equal(Math.max(...writeIndexes) < firstCleanupIndex, true);
  assert.deepEqual(
    operations.filter((operation) => operation.kind === "delete").map((operation) => operation.table),
    [ptoDayValuesTable, ptoDayValuesTable, ptoRowsTable, ptoBucketValuesTable, ptoBucketRowsTable],
  );
}

{
  const client = createClient();
  client.failUpsertTable = ptoBucketValuesTable;

  await assert.rejects(
    savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient),
    /Injected upsert failure/,
  );

  assert.equal(client.operations.some((operation) => operation.kind === "select"), false);
  assert.equal(client.operations.some((operation) => operation.kind === "delete"), false);
  assert.equal(client.operations.some((operation) => operation.table === ptoSettingsTable), false);
}

{
  const client = createClient();
  client.rowsByTable[ptoDayValuesTable] = [
    { table_type: "plan", row_id: "plan-keep", work_date: "2026-04-01", value: 99, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await assert.rejects(
    savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient, {
      expectedUpdatedAt: "2026-04-02T00:00:00.000Z",
    }),
    /PTO data changed in database/,
  );

  assert.equal(client.operations.some((operation) => operation.kind === "upsert"), false);
  assert.equal(client.operations.some((operation) => operation.kind === "delete"), false);
}

{
  const client = createClient();
  client.rowsByTable[ptoDayValuesTable] = [
    { table_type: "plan", row_id: "plan-keep", work_date: "2026-04-01", value: 10, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient, {
    expectedUpdatedAt: "2026-04-02T00:00:00.000Z",
  });

  assert.equal(client.operations.some((operation) => operation.kind === "upsert"), true);
}

{
  const client = createClient();
  await savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient, {
    yearScope: "2026",
  });

  const deleteTables = client.operations
    .filter((operation) => operation.kind === "delete")
    .map((operation) => operation.table);
  assert.deepEqual(deleteTables, [ptoDayValuesTable]);
  assert.equal(deleteTables.includes(ptoRowsTable), false);
  assert.equal(deleteTables.includes(ptoBucketValuesTable), false);
  assert.equal(deleteTables.includes(ptoBucketRowsTable), false);
}

{
  const client = createClient();
  client.rowsByTable[ptoBucketRowsTable] = [
    { row_key: "bucket-keep", updated_at: "2026-04-03T00:00:00.000Z" },
  ];
  client.rowsByTable[ptoBucketValuesTable] = [
    { row_key: "bucket-keep", equipment_key: "excavator", value: 9, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await savePtoStateToSupabaseClient(createState(), client as unknown as SupabasePtoClient, {
    yearScope: "2026",
    expectedUpdatedAt: "2026-04-02T00:00:00.000Z",
  });

  const bucketOperations = client.operations.filter((operation) =>
    operation.table === ptoBucketRowsTable || operation.table === ptoBucketValuesTable
  );
  assert.deepEqual(bucketOperations, []);
}
