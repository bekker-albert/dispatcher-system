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
  upsertPtoBucketRows,
  upsertPtoBucketValues,
  upsertPtoDayValues,
  upsertPtoRows,
  type SupabasePtoTable,
} from "./pto-storage";
import type { PtoDayValuePatch, PtoSnapshotWriteOptions, PtoSnapshotWriteResult } from "./pto-types";

async function supabasePtoInlineWriteResult(client: ReturnType<typeof requireSupabase>): Promise<PtoSnapshotWriteResult> {
  return { updatedAt: await loadSupabasePtoCurrentUpdatedAt(client) };
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

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);

  if (value === null) {
    const { error } = await client
      .from(ptoDayValuesTable)
      .delete()
      .eq("table_type", table)
      .eq("row_id", rowId)
      .eq("work_date", day);
    if (error) throw error;
    return supabasePtoInlineWriteResult(client);
  }

  await upsertPtoDayValues([{
    table_type: table,
    row_id: rowId,
    work_date: day,
    value,
  }], client);
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

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await upsertPtoRows(ptoRowsToRecords(table, [row]), client);
  return savePtoDayValueToSupabase(table, row.id, day, value);
}

export async function savePtoDayValuesToSupabase(table: SupabasePtoTable, values: PtoDayValuePatch[], options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("save-days", { table, values, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  const { upsertRecords, deleteValues } = ptoDayValuePatchesToRecords(table, values);

  await upsertPtoDayValues(upsertRecords, client);

  for (const item of deleteValues) {
    const { error } = await client
      .from(ptoDayValuesTable)
      .delete()
      .eq("table_type", table)
      .eq("row_id", item.rowId)
      .eq("work_date", item.day);
    if (error) throw error;
  }
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

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);
  await upsertPtoRows(ptoRowsToRecords(table, [row]), client);
  return savePtoDayValuesToSupabase(table, values);
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

export async function deletePtoBucketValuesFromSupabase(cellKeys: string[], options: PtoSnapshotWriteOptions = {}) {
  if (shouldRoutePtoThroughServerDatabase()) {
    return ptoDatabaseRequest<PtoSnapshotWriteResult>("delete-bucket-values", { cellKeys, expectedUpdatedAt: options.expectedUpdatedAt });
  }

  const client = requireSupabase();
  await assertSupabasePtoInlineMatchesExpectedUpdatedAt(options.expectedUpdatedAt, client);

  for (const parsed of ptoBucketCellKeysToPairs(cellKeys)) {
    const { error } = await client
      .from(ptoBucketValuesTable)
      .delete()
      .eq("row_key", parsed.rowKey)
      .eq("equipment_key", parsed.equipmentKey);
    if (error) throw error;
  }
  return supabasePtoInlineWriteResult(client);
}
