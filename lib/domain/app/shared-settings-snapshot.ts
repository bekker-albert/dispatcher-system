import { sharedAppSettingKeys } from "./settings";

export type SharedAppSettingsDatabaseSnapshot = {
  values: Record<string, unknown>;
  updatedAtByKey: Record<string, string | null>;
};

export type SharedAppSettingsSaveDelta = {
  settings: Record<string, unknown>;
  expectedUpdatedAt: Record<string, string | null>;
};

function orderedSharedAppSettings(values: Record<string, unknown>) {
  return Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => (
      Object.prototype.hasOwnProperty.call(values, key) ? [[key, values[key]] as const] : []
    )),
  );
}

function normalizeUpdatedAtByKey(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => {
      const updatedAt = (value as Record<string, unknown>)[key];
      return typeof updatedAt === "string" || updatedAt === null
        ? [[key, updatedAt] as const]
        : [];
    }),
  );
}

export function parseSharedAppSettingsDatabaseSnapshot(snapshot: string): SharedAppSettingsDatabaseSnapshot {
  if (!snapshot) return { values: {}, updatedAtByKey: {} };

  try {
    const parsed = JSON.parse(snapshot) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { values: {}, updatedAtByKey: {} };
    }

    const record = parsed as Record<string, unknown>;
    if (record.values && typeof record.values === "object" && !Array.isArray(record.values)) {
      return {
        values: orderedSharedAppSettings(record.values as Record<string, unknown>),
        updatedAtByKey: normalizeUpdatedAtByKey(record.updatedAtByKey),
      };
    }

    return {
      values: orderedSharedAppSettings(record),
      updatedAtByKey: {},
    };
  } catch {
    return { values: {}, updatedAtByKey: {} };
  }
}

export function serializeSharedAppSettingsDatabaseSnapshot(snapshot: SharedAppSettingsDatabaseSnapshot) {
  return JSON.stringify({
    values: orderedSharedAppSettings(snapshot.values),
    updatedAtByKey: normalizeUpdatedAtByKey(snapshot.updatedAtByKey),
  });
}

export function createSharedAppSettingsDatabaseSnapshot(
  records: ReadonlyArray<{ key: string; value: unknown; updated_at?: string | null }>,
) {
  return serializeSharedAppSettingsDatabaseSnapshot({
    values: Object.fromEntries(records.map((record) => [record.key, record.value])),
    updatedAtByKey: Object.fromEntries(
      records.map((record) => [record.key, record.updated_at ?? null]),
    ),
  });
}

export function createSharedAppSettingsSaveDelta(
  currentSettings: Record<string, unknown>,
  databaseSnapshot: string,
): SharedAppSettingsSaveDelta {
  const snapshot = parseSharedAppSettingsDatabaseSnapshot(databaseSnapshot);
  const settings = Object.fromEntries(
    sharedAppSettingKeys.flatMap((key) => {
      if (!Object.prototype.hasOwnProperty.call(currentSettings, key)) return [];
      return JSON.stringify(currentSettings[key]) === JSON.stringify(snapshot.values[key])
        ? []
        : [[key, currentSettings[key]] as const];
    }),
  );

  return {
    settings,
    expectedUpdatedAt: Object.fromEntries(
      Object.keys(settings).map((key) => [key, snapshot.updatedAtByKey[key] ?? null]),
    ),
  };
}

export function applySavedSharedAppSettingsToSnapshot(
  databaseSnapshot: string,
  records: ReadonlyArray<{ key: string; value: unknown; updated_at?: string | null }>,
) {
  const snapshot = parseSharedAppSettingsDatabaseSnapshot(databaseSnapshot);

  for (const record of records) {
    snapshot.values[record.key] = record.value;
    snapshot.updatedAtByKey[record.key] = record.updated_at ?? null;
  }

  return serializeSharedAppSettingsDatabaseSnapshot(snapshot);
}
