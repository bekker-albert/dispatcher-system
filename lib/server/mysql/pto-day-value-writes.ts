import type { RowDataPacket } from "mysql2/promise";
import type { PtoDateTableKey, PtoPlanRow } from "../../domain/pto/date-table";
import {
  ptoDayValueRecordDates,
  ptoPlanRowIds,
  ptoYearDateRange,
  type PtoPersistenceDayValueRecord,
} from "../../domain/pto/persistence-shared";
import { dbExecute, type DbExecutor } from "./pool";
import { chunkValues, ptoWriteBatchSize, scopedDateClause } from "./pto-write-utils";

type DeletePtoDayValuesOptions = {
  yearScope?: string | null;
};

type PtoDayValueRowIdRecord = RowDataPacket & {
  row_id: string;
};

function ptoDayValueDateGroups(rows: PtoPlanRow[]) {
  const groups = new Map<string, { dates: string[]; rowIds: string[] }>();

  ptoDayValueRecordDates(rows).forEach(({ rowId, dates }) => {
    if (!rowId) return;

    const key = dates.join("\u0001");
    const group = groups.get(key) ?? { dates, rowIds: [] };
    group.rowIds.push(rowId);
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

export async function upsertPtoDayValues(records: PtoPersistenceDayValueRecord[], execute: DbExecutor = dbExecute) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += ptoWriteBatchSize) {
    const batch = records.slice(index, index + ptoWriteBatchSize);
    const placeholders = batch.map(() => "(?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.table_type,
      record.row_id,
      record.work_date,
      record.value,
    ]);

    await execute(
      `INSERT INTO pto_day_values (table_type, row_id, work_date, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function deletePtoDayValuesMissingFromState(
  table: PtoDateTableKey,
  rows: PtoPlanRow[],
  execute: DbExecutor = dbExecute,
  options: DeletePtoDayValuesOptions = {},
) {
  for (const { rowIds, dates } of ptoDayValueDateGroups(rows)) {
    for (const rowIdBatch of chunkValues(rowIds)) {
      const rowPlaceholders = rowIdBatch.map(() => "?").join(", ");

      if (dates.length === 0) {
        const values: unknown[] = [table, ...rowIdBatch];
        await execute(
          `DELETE FROM pto_day_values
          WHERE table_type = ?
            AND row_id IN (${rowPlaceholders})${scopedDateClause(options.yearScope, values)}`,
          values,
        );
        continue;
      }

      const values: unknown[] = [table, ...rowIdBatch];
      const dateScopeClause = scopedDateClause(options.yearScope, values);
      const datePlaceholders = dates.map(() => "?").join(", ");
      await execute(
        `DELETE FROM pto_day_values
        WHERE table_type = ?
          AND row_id IN (${rowPlaceholders})
          ${dateScopeClause}
          AND work_date NOT IN (${datePlaceholders})`,
        [...values, ...dates],
      );
    }
  }
}

export async function deletePtoDayValuesForRowsMissingFromYearState(
  table: PtoDateTableKey,
  rows: PtoPlanRow[],
  yearScope: string,
  execute: DbExecutor = dbExecute,
) {
  const { start, end } = ptoYearDateRange(yearScope);
  const rowIds = new Set(ptoPlanRowIds(rows));

  if (rowIds.size === 0) {
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND work_date >= ?
        AND work_date <= ?`,
      [table, start, end],
    );
    return;
  }

  const existingRows = await (execute.rows?.<PtoDayValueRowIdRecord>(
    `SELECT DISTINCT row_id
    FROM pto_day_values
    WHERE table_type = ?
      AND work_date >= ?
      AND work_date <= ?`,
    [table, start, end],
  ) ?? Promise.resolve([]));

  const staleRowIds = existingRows
    .map((record) => record.row_id)
    .filter((rowId) => !rowIds.has(rowId));

  for (const rowIdBatch of chunkValues(staleRowIds)) {
    if (rowIdBatch.length === 0) continue;

    const rowPlaceholders = rowIdBatch.map(() => "?").join(", ");
    await execute(
      `DELETE FROM pto_day_values
      WHERE table_type = ?
        AND work_date >= ?
        AND work_date <= ?
        AND row_id IN (${rowPlaceholders})`,
      [table, start, end, ...rowIdBatch],
    );
  }
}
