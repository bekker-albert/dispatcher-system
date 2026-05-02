import type { PtoBucketRow } from "../domain/pto/buckets";
import type { PtoPlanRow } from "../domain/pto/date-table";
import {
  ptoBucketCellKeysToPairs,
  ptoBucketRowToRecord,
  ptoBucketValueToRecord,
  ptoDayValuePatchesToRecords,
  ptoRowsToRecords,
  ptoYearDateRange,
  splitPtoBucketCellKey,
} from "../domain/pto/persistence-shared";
import {
  ptoDatabaseRequest,
  shouldRoutePtoThroughServerDatabase,
} from "./pto-routing";
import {
  assertSupabasePtoInlineMatchesExpectedUpdatedAt,
  loadSupabasePtoCurrentUpdatedAt,
} from "./pto-freshness";
import {
  ptoBucketRowsTable,
  ptoBucketValuesTable,
  ptoDayValuesTable,
  ptoRowsTable,
  requireSupabase,
  deleteSupabaseBucketValues,
  deleteSupabaseDayValues,
  upsertPtoBucketRows,
  upsertPtoBucketValues,
  upsertPtoDayValues,
  upsertPtoRows,
  type SupabasePtoTable,
  type SupabasePtoClient,
} from "./pto-storage";
import type { PtoDayValuePatch, PtoSnapshotWriteOptions, PtoSnapshotWriteResult } from "./pto-types";

async function supabasePtoInlineWriteResult(client: SupabasePtoClient): Promise<PtoSnapshotWriteResult> {
  return { updatedAt: await loadSupabasePtoCurrentUpdatedAt(client) };
}

function ptoDayDeletePatchesToRecords(table: SupabasePtoTable, values: PtoDayValuePatch[]) {
  return values.map((item) => ({
    table_type: table,
    row_id: item.rowId,
    work_date: item.day,
    value: null,
  }));
}

function ptoBucketPairsToDeleteRecords(pairs: Array<{ rowKey: string; equipmentKey: string }>) {
  return pairs.map((item) => ({
    row_key: item.rowKey,
    equipment_key: item.equipmentKey,
    value: null,
  }));
}

function ptoDayValuePatchesForRow(row: PtoPlanRow, values: PtoDayValuePatch[]) {
  return values.map((item) => ({ ...item, rowId: row.id }));
}

async function savePtoDayValueWithClient(
  client: SupabasePtoClient,
  table: SupabasePtoTable,
  rowId: string,
  day: string,
  value: number | null,
) {
  if (value === null) {
    await deleteSupabaseDayValues(ptoDayDeletePatchesToRecords(table, [{ rowId, day, value }]), client);
    return;
  }

  await upsertPtoDayValues([{
    table_type: table,
    row_id: rowId,
    work_date: day,
    value,
  }], client);
}

async function savePtoDayValuesWithClient(
  client: SupabasePtoClient,
  table: SupabasePtoTable,
  values: PtoDayValuePatch[],
) {
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, values);

  await upsertPtoDayValues(upsertRecords, client);
  await deleteSupabaseDayValues(ptoDayDeletePatchesToRecords(table, deleteValues), client);
}

export async function savePtoDayValueToSupabaseClient(
  table: SupabasePtoTable,
  rowId: string,
  day: string,
  value: number | null,
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
) {
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await savePtoDayValueWithClient(client, table, rowId, day, value);
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoDayValueToSupabase(
  table: SupabasePtoTable,
  rowId: string,
  day: string,
  value: number | null,
  options: PtoSnapshotWriteOptions = {},
) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-day", { table, rowId, day, value, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  return savePtoDayValueToSupabaseClient(table, rowId, day, value, requireSupabase(), options);
}

export async function savePtoDayValueWithRowToSupabaseClient(
  table: SupabasePtoTable,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
) {
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await upsertPtoRows(ptoRowsToRecords(table, [row]), client);
  await savePtoDayValueWithClient(client, table, row.id, day, value);
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoDayValueWithRowToSupabase(
  table: SupabasePtoTable,
  row: PtoPlanRow,
  day: string,
  value: number | null,
  options: PtoSnapshotWriteOptions = {},
) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-day-with-row", { table, row, day, value, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  return savePtoDayValueWithRowToSupabaseClient(table, row, day, value, requireSupabase(), options);
}

export async function savePtoDayValuesToSupabaseClient(
  table: SupabasePtoTable,
  values: PtoDayValuePatch[],
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
) {
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await savePtoDayValuesWithClient(client, table, values);
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoDayValuesToSupabase(table: SupabasePtoTable, values: PtoDayValuePatch[], options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-days", { table, values, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  return savePtoDayValuesToSupabaseClient(table, values, requireSupabase(), options);
}

export async function savePtoDayValuesWithRowToSupabaseClient(
  table: SupabasePtoTable,
  row: PtoPlanRow,
  values: PtoDayValuePatch[],
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
) {
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await upsertPtoRows(ptoRowsToRecords(table, [row]), client);
  await savePtoDayValuesWithClient(
    client,
    table,
    ptoDayValuePatchesForRow(row, values),
  );
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoDayValuesWithRowToSupabase(
  table: SupabasePtoTable,
  row: PtoPlanRow,
  values: PtoDayValuePatch[],
  options: PtoSnapshotWriteOptions = {},
) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-days-with-row", { table, row, values, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  return savePtoDayValuesWithRowToSupabaseClient(table, row, values, requireSupabase(), options);
}

export async function deletePtoRowsFromSupabase(table: SupabasePtoTable, rowIds: string[], options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("delete", { table, rowIds, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  if (rowIds.length === 0) return;
  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);

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
  return supabasePtoInlineWriteResult(client);
}

export async function deletePtoYearFromSupabase(year: string, options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("delete-year", { year, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  const { start, end } = ptoYearDateRange(year);
  const { error } = await client
    .from(ptoDayValuesTable)
    .delete()
    .gte("work_date", start)
    .lte("work_date", end);
  if (error) throw error;
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoBucketRowToSupabase(row: PtoBucketRow, sortIndex = 0, options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-bucket-row", { row, sortIndex, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await upsertPtoBucketRows([ptoBucketRowToRecord(row, sortIndex)], client);
  return supabasePtoInlineWriteResult(client);
}

export async function deletePtoBucketRowFromSupabase(rowKeyValue: string, options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("delete-bucket-row", { rowKey: rowKeyValue, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  const { error: valueError } = await client
    .from(ptoBucketValuesTable)
    .delete()
    .eq("row_key", rowKeyValue);
  if (valueError) throw valueError;

  const { error } = await client
    .from(ptoBucketRowsTable)
    .delete()
    .eq("row_key", rowKeyValue);
  if (error) throw error;
  return supabasePtoInlineWriteResult(client);
}

export async function savePtoBucketValueToSupabase(cellKey: string, value: number | null, options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-bucket-value", { cellKey, value, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const parsed = splitPtoBucketCellKey(cellKey);
  if (!parsed) return;

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);

  if (value === null) {
    const { error } = await client
      .from(ptoBucketValuesTable)
      .delete()
      .eq("row_key", parsed.rowKey)
      .eq("equipment_key", parsed.equipmentKey);
    if (error) throw error;
    return supabasePtoInlineWriteResult(client);
  }

  const record = ptoBucketValueToRecord(cellKey, value);
  if (record) await upsertPtoBucketValues([record], client);
  return supabasePtoInlineWriteResult(client);
}

export async function deletePtoBucketValuesFromSupabaseClient(
  cellKeys: string[],
  client: SupabasePtoClient,
  options: PtoSnapshotWriteOptions = {},
) {
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await deleteSupabaseBucketValues(ptoBucketPairsToDeleteRecords(ptoBucketCellKeysToPairs(cellKeys)), client);
  return supabasePtoInlineWriteResult(client);
}

export async function deletePtoBucketValuesFromSupabase(cellKeys: string[], options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("delete-bucket-values", { cellKeys, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  return deletePtoBucketValuesFromSupabaseClient(cellKeys, requireSupabase(), options);
}
