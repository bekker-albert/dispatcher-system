import { searchWialonUnit, searchWialonUnits } from "./client";
import { formatWialonError } from "./errors";
import {
  applyWialonUnitMappings,
  getStoredWialonUnit,
  insertWialonPositions,
  insertWialonSyncLog,
  listStoredWialonUnits,
  listVisibleStoredWialonUnits,
  listWialonSyncLogs,
  upsertWialonUnits,
} from "./mysql";
import type { WialonUnitMappingInput } from "./types";

function startedAtNow() {
  return new Date().toISOString();
}

async function logWialonSync(input: {
  syncType: string;
  status: "success" | "error";
  message: string;
  startedAt: string;
  details?: unknown;
}) {
  await insertWialonSyncLog({
    ...input,
    finishedAt: new Date().toISOString(),
  });
}

export async function checkWialonConnection() {
  const startedAt = startedAtNow();

  try {
    const units = await searchWialonUnits();
    await logWialonSync({
      syncType: "check-connection",
      status: "success",
      message: `Connection OK. Units found: ${units.length}.`,
      startedAt,
      details: { unitsCount: units.length },
    });

    return {
      ok: true,
      unitsCount: units.length,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const formatted = formatWialonError(error);
    await logWialonSync({
      syncType: "check-connection",
      status: "error",
      message: formatted.error,
      startedAt,
      details: formatted,
    });
    throw error;
  }
}

export async function listLiveWialonUnits() {
  const units = await searchWialonUnits();
  const storedUnits = await listStoredWialonUnits().catch(() => []);
  const storedById = new Map(storedUnits.map((unit) => [unit.id, unit]));

  return units.map((unit) => {
    const stored = storedById.get(unit.id);
    return {
      ...unit,
      vehicleId: stored?.vehicleId ?? null,
      hidden: stored?.hidden ?? false,
      syncedAt: stored?.syncedAt ?? null,
      updatedAt: stored?.updatedAt ?? null,
    };
  });
}

export async function getLiveWialonUnit(id: number) {
  const [unit, stored] = await Promise.all([
    searchWialonUnit(id),
    getStoredWialonUnit(id).catch(() => null),
  ]);

  return {
    ...unit,
    vehicleId: stored?.vehicleId ?? null,
    hidden: stored?.hidden ?? false,
    syncedAt: stored?.syncedAt ?? null,
    updatedAt: stored?.updatedAt ?? null,
  };
}

export async function syncWialonUnits(mappings: WialonUnitMappingInput[] = [], mappingsOnly = false) {
  const startedAt = startedAtNow();

  try {
    const storedUnits = mappingsOnly
      ? await applyWialonUnitMappings(mappings)
      : await upsertWialonUnits(await searchWialonUnits());
    const result = mappings.length ? await applyWialonUnitMappings(mappings) : storedUnits;

    await logWialonSync({
      syncType: mappingsOnly ? "unit-mapping" : "unit-sync",
      status: "success",
      message: mappingsOnly
        ? `Wialon mappings saved: ${mappings.length}.`
        : `Wialon units synced: ${result.length}.`,
      startedAt,
      details: {
        mappingsCount: mappings.length,
        unitsCount: result.length,
      },
    });

    return result;
  } catch (error) {
    const formatted = formatWialonError(error);
    await logWialonSync({
      syncType: mappingsOnly ? "unit-mapping" : "unit-sync",
      status: "error",
      message: formatted.error,
      startedAt,
      details: formatted,
    });
    throw error;
  }
}

export async function syncWialonPositions() {
  const startedAt = startedAtNow();

  try {
    const storedUnits = await listVisibleStoredWialonUnits();
    const units = [];

    for (const unit of storedUnits) {
      units.push(await searchWialonUnit(unit.id));
    }

    const inserted = await insertWialonPositions(units);
    await logWialonSync({
      syncType: "position-sync",
      status: "success",
      message: `Wialon positions synced: ${inserted}.`,
      startedAt,
      details: {
        requestedUnitsCount: storedUnits.length,
        insertedPositionsCount: inserted,
      },
    });

    return {
      requestedUnitsCount: storedUnits.length,
      insertedPositionsCount: inserted,
    };
  } catch (error) {
    const formatted = formatWialonError(error);
    await logWialonSync({
      syncType: "position-sync",
      status: "error",
      message: formatted.error,
      startedAt,
      details: formatted,
    });
    throw error;
  }
}

export async function getWialonAdminSnapshot() {
  const [storedUnits, logs] = await Promise.all([
    listStoredWialonUnits().catch(() => []),
    listWialonSyncLogs().catch(() => []),
  ]);

  return { storedUnits, logs };
}
