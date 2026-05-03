import type { RowDataPacket } from "mysql2/promise";
import type {
  PtoPersistenceBucketRowRecord,
  PtoPersistenceBucketValueRecord,
} from "../../domain/pto/persistence-shared";
import { dbExecute, dbRows, type DbExecutor } from "./pool";
import { chunkValues } from "./pto-write-utils";

type PtoBucketRowKeyRecord = RowDataPacket & {
  row_key: string;
};

type PtoBucketValueKeyRecord = PtoBucketRowKeyRecord & {
  equipment_key: string;
};

async function selectRows<T extends RowDataPacket>(
  execute: DbExecutor,
  sql: string,
  values: unknown[] = [],
) {
  return execute.rows?.<T>(sql, values) ?? dbRows<T>(sql, values);
}

export async function upsertPtoBucketRows(
  records: PtoPersistenceBucketRowRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (!records.length) return;

  for (const batch of chunkValues(records)) {
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [
      record.row_key,
      record.area,
      record.structure,
      record.source,
      record.sort_index,
    ]);

    await execute(
      `INSERT INTO pto_bucket_rows (row_key, area, structure, source, sort_index)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        area = VALUES(area),
        structure = VALUES(structure),
        source = VALUES(source),
        sort_index = VALUES(sort_index),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function upsertPtoBucketValues(
  records: PtoPersistenceBucketValueRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (!records.length) return;

  for (const batch of chunkValues(records)) {
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    const values = batch.flatMap((record) => [record.row_key, record.equipment_key, record.value]);

    await execute(
      `INSERT INTO pto_bucket_values (row_key, equipment_key, value)
      VALUES ${placeholders}
      ON DUPLICATE KEY UPDATE
        value = VALUES(value),
        updated_at = CURRENT_TIMESTAMP(3)`,
      values,
    );
  }
}

export async function deletePtoBucketRowsMissingFromState(
  records: PtoPersistenceBucketRowRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (records.length === 0) {
    await execute("DELETE FROM pto_bucket_rows");
    return;
  }

  const keepKeys = new Set(records.map((record) => record.row_key));
  const staleRows = (await selectRows<PtoBucketRowKeyRecord>(
    execute,
    "SELECT row_key FROM pto_bucket_rows",
  )).filter((record) => !keepKeys.has(record.row_key));

  for (const batch of chunkValues(staleRows)) {
    const placeholders = batch.map(() => "?").join(", ");
    await execute(
      `DELETE FROM pto_bucket_rows
      WHERE row_key IN (${placeholders})`,
      batch.map((record) => record.row_key),
    );
  }
}

export async function deletePtoBucketValuesMissingFromState(
  records: PtoPersistenceBucketValueRecord[],
  execute: DbExecutor = dbExecute,
) {
  if (records.length === 0) {
    await execute("DELETE FROM pto_bucket_values");
    return;
  }

  const keepKeys = new Set(records.map((record) => `${record.row_key}\u0001${record.equipment_key}`));
  const staleRows = (await selectRows<PtoBucketValueKeyRecord>(
    execute,
    "SELECT row_key, equipment_key FROM pto_bucket_values",
  )).filter((record) => !keepKeys.has(`${record.row_key}\u0001${record.equipment_key}`));

  for (const batch of chunkValues(staleRows)) {
    const placeholders = batch.map(() => "(?, ?)").join(", ");
    await execute(
      `DELETE FROM pto_bucket_values
      WHERE (row_key, equipment_key) IN (${placeholders})`,
      batch.flatMap((record) => [record.row_key, record.equipment_key]),
    );
  }
}
