import type { RowDataPacket } from "mysql2/promise";

import {
  emptyDispatchReasonCatalogs,
  normalizeDispatchReasonCatalogs,
  type DispatchReasonCatalogs,
} from "@/lib/domain/dispatch/reason-catalog";
import { dbExecute, dbRows } from "./pool";
import { parseJson, stringifyJson } from "./json";

type CatalogRecord = RowDataPacket & {
  value: unknown;
};

const dispatchReasonCatalogsKey = "dispatch-reason-catalogs";

export async function loadDispatchReasonCatalogsFromMysql(): Promise<DispatchReasonCatalogs> {
  const records = await dbRows<CatalogRecord>(
    "SELECT value FROM app_state WHERE state_key = ? LIMIT 1",
    [dispatchReasonCatalogsKey],
  );
  const record = records[0];
  if (!record) return emptyDispatchReasonCatalogs;

  return normalizeDispatchReasonCatalogs(parseJson(record.value, emptyDispatchReasonCatalogs));
}

export async function saveDispatchReasonCatalogsToMysql(value: unknown): Promise<DispatchReasonCatalogs> {
  const catalogs = normalizeDispatchReasonCatalogs(value);
  await dbExecute(
    `INSERT INTO app_state (state_key, value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [dispatchReasonCatalogsKey, stringifyJson(catalogs)],
  );
  return catalogs;
}
