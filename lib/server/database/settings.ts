import { payloadRecord } from "./payload";
import type { DatabaseResourceHandler } from "./types";

export const handleSettingsDatabaseAction: DatabaseResourceHandler = async ({
  action,
  payload,
  json,
}) => {
  const settings = await import("../mysql/settings");
  const record = payloadRecord(payload);

  if (action === "load") {
    return json(await settings.loadAppSettingsFromMysql((record.keys ?? []) as string[]));
  }
  if (action === "save") {
    await settings.saveAppSettingsToMysql((record.settings ?? {}) as Record<string, unknown>, {
      expectedUpdatedAt: (record.expectedUpdatedAt ?? undefined) as Record<string, string | null | undefined> | undefined,
    });
    return json({ ok: true });
  }

  return undefined;
};
