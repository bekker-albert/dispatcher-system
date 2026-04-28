import { type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./connection";
import { ensureMysqlSchema } from "./schema";

type DbValue = string | number | boolean | null | Date | Buffer;

export type DbExecutor = ((sql: string, values?: unknown[]) => Promise<ResultSetHeader>) & {
  rows?: <T extends RowDataPacket = RowDataPacket>(sql: string, values?: unknown[]) => Promise<T[]>;
};

function normalizeValues(values: unknown[]): DbValue[] {
  return values.map((value) => {
    if (value === undefined) return null;
    if (
      value === null
      || typeof value === "string"
      || typeof value === "number"
      || typeof value === "boolean"
      || value instanceof Date
      || Buffer.isBuffer(value)
    ) {
      return value;
    }

    return JSON.stringify(value);
  });
}

export async function dbRows<T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []) {
  await ensureMysqlSchema();
  const [rows] = await getMysqlPool().query<T[]>(sql, normalizeValues(values));
  return rows;
}

export async function dbExecute(sql: string, values: unknown[] = []) {
  await ensureMysqlSchema();
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, normalizeValues(values));
  return result;
}

function createConnectionExecutor(connection: PoolConnection): DbExecutor {
  const execute = (async (sql, values = []) => {
    const [result] = await connection.execute<ResultSetHeader>(sql, normalizeValues(values));
    return result;
  }) as DbExecutor;

  execute.rows = async <T extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []) => {
    const [rows] = await connection.query<T[]>(sql, normalizeValues(values));
    return rows;
  };

  return execute;
}

export async function dbTransaction<T>(callback: (execute: DbExecutor) => Promise<T>) {
  await ensureMysqlSchema();

  const connection = await getMysqlPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(createConnectionExecutor(connection));
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Keep the original transaction failure.
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function dbRawExecute(sql: string, values: unknown[] = []) {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, normalizeValues(values));
  return result;
}
