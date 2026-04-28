import {
  ptoMissingBucketRowRecords,
  ptoMissingBucketValueRecords,
  ptoMissingDayValueRecords,
  ptoMissingRowRecords,
} from "../domain/pto/persistence-shared";
import {
  loadCurrentSupabaseBucketRows,
  loadCurrentSupabaseBucketValues,
  loadCurrentSupabaseDayValues,
  loadCurrentSupabaseRows,
} from "./pto-storage-load";
import {
  deleteSupabaseBucketRows,
  deleteSupabaseBucketValues,
  deleteSupabaseDayValues,
  deleteSupabaseRowsByTable,
} from "./pto-storage-write";
import type {
  PtoBucketRowRecord,
  PtoBucketValueRecord,
  PtoDayValueRecord,
  PtoRowRecord,
  SupabasePtoClient,
  SupabasePtoTable,
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

export async function deletePtoRowsMissingFromState(records: PtoRowRecord[], client?: SupabasePtoClient) {
  const staleRows = ptoMissingRowRecords(await loadCurrentSupabaseRows(client), records);

  for (const [table, rows] of groupBy(staleRows, (record) => record.table_type)) {
    await deleteSupabaseRowsByTable(table as SupabasePtoTable, rows.map((record) => record.row_id), client);
  }
}

export async function deletePtoDayValuesMissingFromState(
  records: PtoDayValueRecord[],
  client?: SupabasePtoClient,
  options: { yearScope?: string | null } = {},
) {
  await deleteSupabaseDayValues(
    ptoMissingDayValueRecords(await loadCurrentSupabaseDayValues(client, options), records),
    client,
  );
}

export async function deletePtoBucketRowsMissingFromState(records: PtoBucketRowRecord[], client?: SupabasePtoClient) {
  const staleRows = ptoMissingBucketRowRecords(await loadCurrentSupabaseBucketRows(client), records);
  await deleteSupabaseBucketRows(staleRows.map((record) => record.row_key), client);
}

export async function deletePtoBucketValuesMissingFromState(
  records: PtoBucketValueRecord[],
  client?: SupabasePtoClient,
) {
  await deleteSupabaseBucketValues(
    ptoMissingBucketValueRecords(await loadCurrentSupabaseBucketValues(client), records),
    client,
  );
}
