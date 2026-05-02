import type { MysqlClientSnapshotMeta } from "../mysql/app-state";
import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";

function databaseErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export const handleAppStateDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const appState = await import("../mysql/app-state");
  const record = payloadRecord(payload);

  if (action === "load") return json(await appState.loadAppStateFromMysql());
  if (action === "load-bootstrap") {
    const settings = await import("../mysql/settings");
    const [appStateResult, settingsResult] = await Promise.allSettled([
      appState.loadAppStateFromMysql(),
      settings.loadAppSettingsFromMysql((record.keys ?? []) as string[]),
    ]);

    return json({
      appState: appStateResult.status === "fulfilled" ? appStateResult.value : null,
      appStateError: appStateResult.status === "rejected" ? databaseErrorMessage(appStateResult.reason) : undefined,
      settings: settingsResult.status === "fulfilled" ? settingsResult.value : [],
      settingsError: settingsResult.status === "rejected" ? databaseErrorMessage(settingsResult.reason) : undefined,
    });
  }
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
