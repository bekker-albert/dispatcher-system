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
import type { WialonUnit, WialonUnitMappingInput } from "./types";

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
      ? await listStoredWialonUnits()
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
  const storedUnits = await listVisibleStoredWialonUnits();
  const units: WialonUnit[] = [];
  const failedUnits: Array<{ id: number; name: string; error: string; details: unknown }> = [];
  const unitsWithoutPosition: Array<{ id: number; name: string; reason: string }> = [];

  for (const storedUnit of storedUnits) {
    try {
      const liveUnit = await searchWialonUnit(storedUnit.id);
      units.push(liveUnit);

      if (!liveUnit.position) {
        unitsWithoutPosition.push({
          id: storedUnit.id,
          name: storedUnit.name,
          reason: "Wialon returned the unit without coordinates",
        });
      }
    } catch (error) {
      const formatted = formatWialonError(error);
      failedUnits.push({
        id: storedUnit.id,
        name: storedUnit.name,
        error: formatted.error,
        details: formatted,
      });
    }
  }

  try {
    const inserted = await insertWialonPositions(units);
    await upsertWialonUnits(units);
    const hasProblems = failedUnits.length > 0 || unitsWithoutPosition.length > 0;

    await logWialonSync({
      syncType: "position-sync",
      status: failedUnits.length > 0 ? "error" : "success",
      message: hasProblems
        ? `Wialon positions synced: ${inserted}. Unit snapshots refreshed: ${units.length}. Failed units: ${failedUnits.length}. Units without coordinates: ${unitsWithoutPosition.length}.`
        : `Wialon positions synced: ${inserted}. Unit snapshots refreshed: ${units.length}.`,
      startedAt,
      details: {
        requestedUnitsCount: storedUnits.length,
        fetchedUnitsCount: units.length,
        insertedPositionsCount: inserted,
        refreshedUnitsCount: units.length,
        failedUnitsCount: failedUnits.length,
        unitsWithoutPositionCount: unitsWithoutPosition.length,
        failedUnits,
        unitsWithoutPosition,
      },
    });

    return {
      requestedUnitsCount: storedUnits.length,
      fetchedUnitsCount: units.length,
      insertedPositionsCount: inserted,
      refreshedUnitsCount: units.length,
      failedUnitsCount: failedUnits.length,
      unitsWithoutPositionCount: unitsWithoutPosition.length,
      failedUnits,
      unitsWithoutPosition,
    };
  } catch (error) {
    const formatted = formatWialonError(error);
    await logWialonSync({
      syncType: "position-sync",
      status: "error",
      message: formatted.error,
      startedAt,
      details: {
        ...formatted,
        requestedUnitsCount: storedUnits.length,
        fetchedUnitsCount: units.length,
        failedUnitsCount: failedUnits.length,
        unitsWithoutPositionCount: unitsWithoutPosition.length,
        failedUnits,
        unitsWithoutPosition,
      },
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
