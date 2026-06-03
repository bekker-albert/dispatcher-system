import type { RowDataPacket } from "mysql2/promise";

import { dbExecute, dbRows, dbTransaction, type DbExecutor } from "@/lib/server/mysql/pool";
import type { StoredWialonUnit, WialonPosition, WialonSyncLog, WialonTelemetry, WialonUnit, WialonUnitMappingInput } from "./types";

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asBoolean(value: unknown) {
  const numberValue = asNumber(value);
  if (numberValue !== null) return numberValue > 0;
  if (typeof value === "boolean") return value;
  return null;
}

function unixTimeToIso(value: unknown) {
  const seconds = asNumber(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function paramValue(params: Record<string, unknown>, key: string) {
  const param = asRecord(params[key]);
  return Object.prototype.hasOwnProperty.call(param, "v") ? param.v : undefined;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = asNumber(value);
    if (numberValue !== null) return numberValue;
  }
  return null;
}

function normalizeStoredPosition(unitRaw: Record<string, unknown>): WialonPosition | null {
  const position = asRecord(unitRaw.pos);
  if (!Object.keys(position).length) return null;

  return {
    latitude: asNumber(position.y),
    longitude: asNumber(position.x),
    speed: asNumber(position.s),
    course: asNumber(position.c),
    altitude: asNumber(position.z),
    time: unixTimeToIso(position.t),
    raw: position,
  };
}

function normalizeStoredTelemetry(unitRaw: Record<string, unknown>, position: WialonPosition | null): WialonTelemetry {
  const lastMessage = asRecord(unitRaw.lmsg);
  const lastMessagePosition = asRecord(lastMessage.pos);
  const lastMessageParams = asRecord(lastMessage.p);
  const params = asRecord(unitRaw.prms);

  return {
    lastSignalAt: unixTimeToIso(lastMessage.t ?? position?.time),
    latitude: firstNumber(position?.latitude, lastMessagePosition.y),
    longitude: firstNumber(position?.longitude, lastMessagePosition.x),
    speed: firstNumber(position?.speed, lastMessagePosition.s, lastMessageParams.can_speed, paramValue(params, "can_speed")),
    satellites: firstNumber(position?.raw.sc, lastMessagePosition.sc, lastMessageParams.sats, paramValue(params, "sats")),
    mileage: firstNumber(lastMessageParams.mileage, paramValue(params, "mileage"), unitRaw.cnm, unitRaw.cnm_km),
    canMileage: firstNumber(lastMessageParams.can_mileage, paramValue(params, "can_mileage")),
    engineHours: firstNumber(lastMessageParams.engine_hours, paramValue(params, "engine_hours"), unitRaw.cneh),
    engineOn: asBoolean(lastMessageParams["engine operation"] ?? paramValue(params, "engine operation") ?? paramValue(params, "in1")),
    engineRpm: firstNumber(lastMessageParams.engine_rpm, paramValue(params, "engine_rpm")),
    fuelLevel: firstNumber(lastMessageParams.can_fuel_vlm, lastMessageParams["fuel level"], paramValue(params, "can_fuel_vlm"), paramValue(params, "fuel level")),
    externalVoltage: firstNumber(lastMessageParams.pwr_ext, lastMessageParams.voltage, paramValue(params, "pwr_ext"), paramValue(params, "voltage")),
    internalVoltage: firstNumber(lastMessageParams.pwr_int, paramValue(params, "pwr_int")),
    gsmLevel: firstNumber(lastMessageParams.gsm, paramValue(params, "gsm")),
    validNavigation: asBoolean(lastMessageParams.valid_nav ?? paramValue(params, "valid_nav")),
  };
}

function toStoredWialonUnit(row: WialonUnitRow): StoredWialonUnit {
  const raw = parseJsonField(row.raw);
  const unitRaw = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const position = normalizeStoredPosition(unitRaw);

  return {
    id: Number(row.wialon_unit_id),
    name: row.name,
    uniqueId: row.unique_id ?? "",
    phone: row.phone ?? "",
    position,
    telemetry: normalizeStoredTelemetry(unitRaw, position),
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
