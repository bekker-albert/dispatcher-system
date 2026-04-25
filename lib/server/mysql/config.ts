import type { PoolOptions } from "mysql2/promise";

export type MysqlConfig = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

export function mysqlConfigured() {
  return Boolean(process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);
}

export function getMysqlConfig(): MysqlConfig {
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (!database || !user || !password) {
    throw new Error("MySQL is not configured: DB_NAME, DB_USER and DB_PASSWORD are required");
  }

  const port = Number(process.env.DB_PORT ?? 3306);

  return {
    host: process.env.DB_HOST || "localhost",
    port: Number.isFinite(port) ? port : 3306,
    database,
    user,
    password,
  };
}

export function getMysqlPoolOptions(): PoolOptions {
  const config = getMysqlConfig();

  return {
    ...config,
    connectionLimit: 8,
    waitForConnections: true,
    dateStrings: true,
    charset: "utf8mb4",
  };
}
