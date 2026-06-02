import type { RowDataPacket } from "mysql2/promise";

import { dbExecute, dbRows, dbTransaction, type DbExecutor } from "@/lib/server/mysql/pool";
import type { StoredWialonUnit, WialonPosition, WialonSyncLog, WialonUnit, WialonUnitMappingInput } from "./types";

type WialonUnitRow = RowDataPacket & {
  wialon_unit_id: number;
  vehicle_id: number | null;
  name: string;
  unique_id: string | null;
  phone: string | null;
  raw: unknown;
  hidden: number;
  synced_at: Date | string | null;
  updated_at: Date | string | null;
};

type WialonSyncLogRow = RowDataPacket & {
  id: number;
  sync_type: string;
  status: string;
  message: string | null;
  details: unknown;
  started_at: Date | string;
  finished_at: Date | string | null;
  created_at: Date | string;
};

function dateToIso(value: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function parseJsonField(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

function toStoredWialonUnit(row: WialonUnitRow): StoredWialonUnit {
  const raw = parseJsonField(row.raw);
  const unitRaw = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};

  return {
    id: Number(row.wialon_unit_id),
    name: row.name,
    uniqueId: row.unique_id ?? "",
    phone: row.phone ?? "",
    position: null,
    raw: unitRaw,
    vehicleId: row.vehicle_id,
    hidden: Boolean(row.hidden),
    syncedAt: dateToIso(row.synced_at),
    updatedAt: dateToIso(row.updated_at),
  };
}

function toSyncLog(row: WialonSyncLogRow): WialonSyncLog {
  return {
    id: Number(row.id),
    syncType: row.sync_type,
    status: row.status,
    message: row.message ?? "",
    details: parseJsonField(row.details),
    startedAt: dateToIso(row.started_at) ?? "",
    finishedAt: dateToIso(row.finished_at),
    createdAt: dateToIso(row.created_at) ?? "",
  };
}

export async function listStoredWialonUnits() {
  const rows = await dbRows<WialonUnitRow>(
    "SELECT * FROM wialon_units ORDER BY hidden ASC, name ASC",
  );
  return rows.map(toStoredWialonUnit);
}

export async function getStoredWialonUnit(id: number) {
  const rows = await dbRows<WialonUnitRow>(
    "SELECT * FROM wialon_units WHERE wialon_unit_id = ? LIMIT 1",
    [id],
  );
  return rows[0] ? toStoredWialonUnit(rows[0]) : null;
}

export async function upsertWialonUnits(units: WialonUnit[]) {
  await dbTransaction(async (execute) => {
    for (const unit of units) {
      await execute(
        `INSERT INTO wialon_units
          (wialon_unit_id, name, unique_id, phone, raw, synced_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          unique_id = VALUES(unique_id),
          phone = VALUES(phone),
          raw = VALUES(raw),
          synced_at = NOW(),
          updated_at = CURRENT_TIMESTAMP(3)`,
        [unit.id, unit.name, unit.uniqueId || null, unit.phone || null, unit.raw],
      );
    }
  });

  return listStoredWialonUnits();
}

export async function applyWialonUnitMappings(mappings: WialonUnitMappingInput[]) {
  await dbTransaction(async (execute) => {
    for (const mapping of mappings) {
      await execute(
        `UPDATE wialon_units
        SET vehicle_id = ?, hidden = COALESCE(?, hidden), updated_at = CURRENT_TIMESTAMP(3)
        WHERE wialon_unit_id = ?`,
        [
          mapping.vehicleId ?? null,
          typeof mapping.hidden === "boolean" ? mapping.hidden : null,
          mapping.wialonUnitId,
        ],
      );
    }
  });

  return listStoredWialonUnits();
}

export async function listVisibleStoredWialonUnits() {
  const rows = await dbRows<WialonUnitRow>(
    "SELECT * FROM wialon_units WHERE hidden = 0 ORDER BY name ASC",
  );
  return rows.map(toStoredWialonUnit);
}

export async function insertWialonPosition(unitId: number, position: WialonPosition | null, execute?: DbExecutor) {
  if (!position) return;

  const runner = execute ?? dbExecute;
  await runner(
    `INSERT INTO wialon_positions
      (wialon_unit_id, latitude, longitude, speed, course, altitude, position_time, raw)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      unitId,
      position.latitude,
      position.longitude,
      position.speed,
      position.course,
      position.altitude,
      position.time ? new Date(position.time) : null,
      position.raw,
    ],
  );
}

export async function insertWialonPositions(units: WialonUnit[]) {
  let inserted = 0;
  await dbTransaction(async (execute) => {
    for (const unit of units) {
      if (!unit.position) continue;
      await insertWialonPosition(unit.id, unit.position, execute);
      inserted += 1;
    }
  });

  return inserted;
}

export async function insertWialonSyncLog(input: {
  syncType: string;
  status: string;
  message?: string;
  details?: unknown;
  startedAt?: string;
  finishedAt?: string;
}) {
  await dbExecute(
    `INSERT INTO wialon_sync_logs
      (sync_type, status, message, details, started_at, finished_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.syncType,
      input.status,
      input.message ?? "",
      input.details ?? null,
      input.startedAt ? new Date(input.startedAt) : new Date(),
      input.finishedAt ? new Date(input.finishedAt) : new Date(),
    ],
  );
}

export async function listWialonSyncLogs(limit = 20) {
  const rows = await dbRows<WialonSyncLogRow>(
    "SELECT * FROM wialon_sync_logs ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
  return rows.map(toSyncLog);
}
