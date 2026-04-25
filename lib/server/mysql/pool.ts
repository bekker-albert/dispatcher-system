import { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { getMysqlPool } from "./connection";
import { ensureMysqlSchema } from "./schema";

type DbValue = string | number | boolean | null | Date | Buffer;

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

export async function dbRawExecute(sql: string, values: unknown[] = []) {
  const [result] = await getMysqlPool().execute<ResultSetHeader>(sql, normalizeValues(values));
  return result;
}
