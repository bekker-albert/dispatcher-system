import assert from "node:assert/strict";
import {
  deletePtoBucketValuesFromSupabaseClient,
  savePtoDayValueWithRowToSupabaseClient,
  savePtoDayValuesWithRowToSupabaseClient,
} from "../lib/supabase/pto-commands";
import {
  ptoBucketRowsTable,
  ptoBucketValuesTable,
  ptoDayValuesTable,
  ptoRowsTable,
  ptoSettingsTable,
  type SupabasePtoClient,
} from "../lib/supabase/pto-storage";

type OperationFilter = { name: string; column: string; value: unknown };
type Operation = {
  kind: "upsert" | "select" | "delete";
  table: string;
  records?: unknown[];
  filters?: OperationFilter[];
};

class FakeSupabaseQuery {
  private readonly filters: OperationFilter[] = [];

  constructor(
    private readonly client: FakeSupabaseClient,
    private readonly table: string,
  ) {}

  async upsert(records: unknown[]) {
    this.client.operations.push({ kind: "upsert", table: this.table, records });
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
    this.client.operations.push({ kind: "delete", table: this.table, filters: this.filters });
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

const row = {
  id: "row-real",
  area: "Аксу",
  location: "",
  structure: "Подача руды",
  customerCode: "AAM",
  unit: "тн",
  status: "В работе",
  carryover: 0,
  dailyPlans: {},
  years: ["2026"],
};

function fakeClient() {
  return new FakeSupabaseClient() as unknown as FakeSupabaseClient & SupabasePtoClient;
}

function operationIndex(operations: Operation[], kind: Operation["kind"], table: string) {
  const index = operations.findIndex((operation) => operation.kind === kind && operation.table === table);
  assert.notEqual(index, -1, `${kind} ${table} was not called`);
  return index;
}

{
  const client = fakeClient();
  client.rowsByTable[ptoDayValuesTable] = [
    { table_type: "plan", row_id: row.id, work_date: "2026-04-01", value: 9, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await savePtoDayValueWithRowToSupabaseClient("plan", row, "2026-04-01", 10, client, {
    expectedUpdatedAt: "2026-04-03T00:00:00.000Z",
  });

  const rowUpsertIndex = operationIndex(client.operations, "upsert", ptoRowsTable);
  const dayUpsertIndex = operationIndex(client.operations, "upsert", ptoDayValuesTable);
  assert.equal(rowUpsertIndex < dayUpsertIndex, true);
  assert.equal(client.operations.slice(0, rowUpsertIndex).every((operation) => operation.kind === "select"), true);
  assert.equal(
    client.operations.slice(0, rowUpsertIndex).some((operation) => operation.table === ptoDayValuesTable),
    true,
  );

  assert.equal((client.operations[rowUpsertIndex]?.records?.[0] as { row_id?: unknown } | undefined)?.row_id, row.id);
  assert.deepEqual(client.operations[dayUpsertIndex]?.records, [{
    table_type: "plan",
    row_id: row.id,
    work_date: "2026-04-01",
    value: 10,
  }]);
}

{
  const client = fakeClient();
  await savePtoDayValuesWithRowToSupabaseClient("plan", row, [
    { rowId: "wrong-row", day: "2026-04-01", value: 10 },
    { rowId: "wrong-row", day: "2026-04-02", value: null },
  ], client);

  const dayUpsert = client.operations.find((operation) => operation.kind === "upsert" && operation.table === ptoDayValuesTable);
  assert.deepEqual(dayUpsert?.records, [{
    table_type: "plan",
    row_id: row.id,
    work_date: "2026-04-01",
    value: 10,
  }]);

  const dayDelete = client.operations.find((operation) => operation.kind === "delete" && operation.table === ptoDayValuesTable);
  assert.deepEqual(dayDelete?.filters, [
    { name: "eq", column: "table_type", value: "plan" },
    { name: "eq", column: "row_id", value: row.id },
    { name: "in", column: "work_date", value: ["2026-04-02"] },
  ]);
}

{
  const client = fakeClient();
  client.rowsByTable[ptoDayValuesTable] = [
    { table_type: "plan", row_id: row.id, work_date: "2026-04-01", value: 9, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await assert.rejects(
    savePtoDayValueWithRowToSupabaseClient("plan", row, "2026-04-01", 10, client, {
      expectedUpdatedAt: "2026-04-02T00:00:00.000Z",
    }),
    /PTO data changed in database/,
  );

  assert.equal(client.operations.some((operation) => operation.kind === "upsert"), false);
  assert.equal(client.operations.some((operation) => operation.kind === "delete"), false);
}

{
  const client = fakeClient();
  client.rowsByTable[ptoRowsTable] = [
    { table_type: "plan", row_id: row.id, updated_at: "2026-04-03T00:00:00.000Z" },
  ];

  await assert.rejects(
    savePtoDayValuesWithRowToSupabaseClient("plan", row, [
      { rowId: "wrong-row", day: "2026-04-01", value: 10 },
    ], client, {
      expectedUpdatedAt: "2026-04-02T00:00:00.000Z",
    }),
    /PTO data changed in database/,
  );

  assert.equal(client.operations.some((operation) => operation.kind === "upsert"), false);
  assert.equal(client.operations.some((operation) => operation.kind === "delete"), false);
}

{
  const client = fakeClient();
  await deletePtoBucketValuesFromSupabaseClient([
    "work-a::excavator-1",
    "work-a::loader-1",
    "work-b::excavator-1",
  ], client);

  const deletes = client.operations.filter((operation) => operation.kind === "delete" && operation.table === ptoBucketValuesTable);
  assert.deepEqual(deletes.map((operation) => operation.filters), [
    [
      { name: "eq", column: "row_key", value: "work-a" },
      { name: "in", column: "equipment_key", value: ["excavator-1", "loader-1"] },
    ],
    [
      { name: "eq", column: "row_key", value: "work-b" },
      { name: "in", column: "equipment_key", value: ["excavator-1"] },
    ],
  ]);
}
