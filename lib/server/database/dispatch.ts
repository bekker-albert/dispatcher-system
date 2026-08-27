import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";

export const handleDispatchDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const catalogs = await import("../mysql/dispatch-reason-catalogs");
  const record = payloadRecord(payload);

  if (action === "load-reason-catalogs") {
    return json({ catalogs: await catalogs.loadDispatchReasonCatalogsFromMysql() });
  }

  if (action === "save-reason-catalogs") {
    return json({ catalogs: await catalogs.saveDispatchReasonCatalogsToMysql(record.catalogs) });
  }

  return undefined;
};
