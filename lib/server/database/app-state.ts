import type { MysqlClientSnapshotMeta } from "../mysql/app-state";
import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";

export const handleAppStateDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const appState = await import("../mysql/app-state");
  const record = payloadRecord(payload);

  if (action === "load") return json(await appState.loadAppStateFromMysql());
  if (action === "save") {
    const saveOptions = Object.prototype.hasOwnProperty.call(record, "expectedUpdatedAt")
      ? { expectedUpdatedAt: (record.expectedUpdatedAt ?? null) as string | null }
      : {};
    const savedState = await appState.saveAppStateToMysql(
      (record.storage ?? {}) as Record<string, string>,
      saveOptions,
    );
    return json(savedState);
  }
  if (action === "save-client-snapshot") {
    await appState.saveClientAppSnapshotToMysql(
      String(record.clientId ?? ""),
      (record.storage ?? {}) as Record<string, string>,
      (record.meta ?? { reason: "" }) as MysqlClientSnapshotMeta,
    );
    return json({ ok: true });
  }
  if (action === "load-client-snapshots") return json(await appState.loadClientAppSnapshotsFromMysql());

  return undefined;
};
