import mysql, { type Pool } from "mysql2/promise";
import { getMysqlPoolOptions } from "./config";

let pool: Pool | null = null;

export function getMysqlPool() {
  if (!pool) {
    pool = mysql.createPool(getMysqlPoolOptions());
  }

  return pool;
}

export async function closeMysqlPool() {
  if (!pool) return;

  await pool.end();
  pool = null;
}
