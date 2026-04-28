import { upsertSupabaseBatches } from "./batch";
import {
  ptoBucketRowsTable,
  ptoBucketValuesTable,
  ptoDayValuesTable,
  ptoRowsTable,
  requireSupabase,
  type PtoBucketRowRecord,
  type PtoBucketValueRecord,
  type PtoDayValueRecord,
  type PtoRowRecord,
  type SupabasePtoClient,
  type SupabasePtoTable,
} from "./pto-schema";

function groupBy<TItem>(items: TItem[], getKey: (item: TItem) => string) {
  return items.reduce<Map<string, TItem[]>>((map, item) => {
    const key = getKey(item);
    const values = map.get(key) ?? [];
    values.push(item);
    map.set(key, values);
    return map;
  }, new Map<string, TItem[]>());
}

export async function upsertPtoRows(records: PtoRowRecord[], client = requireSupabase()) {
  await upsertSupabaseBatches(client, ptoRowsTable, records, "table_type,row_id");
}

export async function upsertPtoDayValues(records: PtoDayValueRecord[], client = requireSupabase()) {
  await upsertSupabaseBatches(client, ptoDayValuesTable, records, "table_type,row_id,work_date");
}

export async function upsertPtoBucketRows(records: PtoBucketRowRecord[], client = requireSupabase()) {
  if (!records.length) return;

  const { error } = await client
    .from(ptoBucketRowsTable)
    .upsert(records, { onConflict: "row_key" });
  if (error) throw error;
}

export async function upsertPtoBucketValues(records: PtoBucketValueRecord[], client = requireSupabase()) {
  await upsertSupabaseBatches(client, ptoBucketValuesTable, records, "row_key,equipment_key");
}

export async function deleteSupabaseRowsByTable(
  table: SupabasePtoTable,
  rowIds: string[],
  client: SupabasePtoClient = requireSupabase(),
) {
  if (!rowIds.length) return;

  const { error: dayValuesError } = await client
    .from(ptoDayValuesTable)
    .delete()
    .eq("table_type", table)
    .in("row_id", rowIds);
  if (dayValuesError) throw dayValuesError;

  const { error } = await client
    .from(ptoRowsTable)
    .delete()
    .eq("table_type", table)
    .in("row_id", rowIds);
  if (error) throw error;
}

export async function deleteSupabaseDayValues(
  records: PtoDayValueRecord[],
  client: SupabasePtoClient = requireSupabase(),
) {
  if (!records.length) return;

  const groups = groupBy(records, (record) => `${record.table_type}::${record.row_id}`);

  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;

    const { error } = await client
      .from(ptoDayValuesTable)
      .delete()
      .eq("table_type", first.table_type)
      .eq("row_id", first.row_id)
      .in("work_date", group.map((record) => record.work_date));
    if (error) throw error;
  }
}

export async function deleteSupabaseBucketRows(
  rowKeys: string[],
  client: SupabasePtoClient = requireSupabase(),
) {
  if (!rowKeys.length) return;

  const { error } = await client
    .from(ptoBucketRowsTable)
    .delete()
    .in("row_key", rowKeys);
  if (error) throw error;
}

export async function deleteSupabaseBucketValues(
  records: PtoBucketValueRecord[],
  client: SupabasePtoClient = requireSupabase(),
) {
  if (!records.length) return;

  const groups = groupBy(records, (record) => record.row_key);

  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;

    const { error } = await client
      .from(ptoBucketValuesTable)
      .delete()
      .eq("row_key", first.row_key)
      .in("equipment_key", group.map((record) => record.equipment_key));
    if (error) throw error;
  }
}
