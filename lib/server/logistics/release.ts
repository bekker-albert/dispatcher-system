import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthUser } from "../../domain/auth/types";
import { isAuthUserSuperuser } from "../../domain/auth/types";
import type { LogisticsTripStatus } from "../../domain/logistics/types";
import { dbRows, dbTransaction } from "../mysql/pool";
import { transitionLogisticsTrip } from "./process";

type Meta = { ip?: string; userAgent?: string; correlationId?: string; reason?: string };

export type LogisticsReleaseCheckKey =
  | "driverAssigned"
  | "vehicleAssigned"
  | "medicalPassed"
  | "technicalPassed"
  | "vehicleDocumentsValid"
  | "driverDocumentsValid"
  | "noCriticalDefects"
  | "capacityCompliant"
  | "requiredDocumentsGenerated";

export type LogisticsReleaseChecks = Record<LogisticsReleaseCheckKey, boolean>;

export type LogisticsTripReleaseRecord = {
  id: string;
  tripId: string;
  status: "pending" | "blocked" | "ready" | "overridden";
  checks: LogisticsReleaseChecks;
  blockingReasons: string[];
  overrideReason?: string;
  checkedByUserId?: string;
  checkedByDisplayName?: string;
  checkedAt?: string;
  approvedByUserId?: string;
  approvedByDisplayName?: string;
  approvedAt?: string;
  updatedAt: string;
};

type ReleaseRow = RowDataPacket & {
  release_id: string;
  trip_id: string;
  status: LogisticsTripReleaseRecord["status"];
  checks: string | LogisticsReleaseChecks;
  blocking_reasons: string | string[];
  override_reason: string | null;
  checked_by_user_id: string | null;
  checked_by_display_name: string | null;
  checked_at: Date | null;
  approved_by_user_id: string | null;
  approved_by_display_name: string | null;
  approved_at: Date | null;
  updated_at: Date;
};

type TripRow = RowDataPacket & {
  trip_id: string;
  status: LogisticsTripStatus;
  vehicle_id: string | null;
  driver_user_id: string | null;
};

const checkLabels: Record<LogisticsReleaseCheckKey, string> = {
  driverAssigned: "Не назначен водитель",
  vehicleAssigned: "Не назначен автомобиль",
  medicalPassed: "Нет медицинского допуска водителя",
  technicalPassed: "Нет технического допуска автомобиля",
  vehicleDocumentsValid: "Не подтверждена действительность документов автомобиля",
  driverDocumentsValid: "Не подтверждены документы и допуски водителя",
  noCriticalDefects: "Не подтверждено отсутствие критических дефектов",
  capacityCompliant: "Не подтверждено соблюдение вместимости и грузоподъёмности",
  requiredDocumentsGenerated: "Не сформирован обязательный комплект документов",
};

const emptyChecks: LogisticsReleaseChecks = {
  driverAssigned: false,
  vehicleAssigned: false,
  medicalPassed: false,
  technicalPassed: false,
  vehicleDocumentsValid: false,
  driverDocumentsValid: false,
  noCriticalDefects: false,
  capacityCompliant: false,
  requiredDocumentsGenerated: false,
};

function jsonObject<T>(value: string | T, fallback: T): T {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function iso(value: Date | null) { return value ? value.toISOString() : undefined; }

function mapRelease(row: ReleaseRow): LogisticsTripReleaseRecord {
  return {
    id: row.release_id,
    tripId: row.trip_id,
    status: row.status,
    checks: { ...emptyChecks, ...jsonObject(row.checks, emptyChecks) },
    blockingReasons: jsonObject(row.blocking_reasons, [] as string[]),
    overrideReason: row.override_reason ?? undefined,
    checkedByUserId: row.checked_by_user_id ?? undefined,
    checkedByDisplayName: row.checked_by_display_name ?? undefined,
    checkedAt: iso(row.checked_at),
    approvedByUserId: row.approved_by_user_id ?? undefined,
    approvedByDisplayName: row.approved_by_display_name ?? undefined,
    approvedAt: iso(row.approved_at),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function audit(
  execute: Parameters<Parameters<typeof dbTransaction>[0]>[0],
  user: AuthUser,
  eventType: string,
  tripId: string,
  before: unknown,
  after: unknown,
  meta: Meta,
) {
  await execute(
    `INSERT INTO logistics_audit_events (
      audit_id, actor_user_id, actor_display_name, event_type, entity_type, entity_id,
      reason, before_snapshot, after_snapshot, source, correlation_id, request_ip, user_agent
    ) VALUES (?, ?, ?, ?, 'logistics_trip_release', ?, ?, ?, ?, 'ui', ?, ?, ?)`,
    [randomUUID(), user.id, user.displayName, eventType, tripId, meta.reason ?? null,
      before ?? null, after ?? null, meta.correlationId ?? randomUUID(), meta.ip ?? null, meta.userAgent ?? null],
  );
}

async function getTrip(tripId: string) {
  const [trip] = await dbRows<TripRow>(
    "SELECT trip_id, status, vehicle_id, driver_user_id FROM logistics_trips WHERE trip_id = ? LIMIT 1",
    [tripId],
  );
  if (!trip) throw new Error("Рейс не найден");
  return trip;
}

export async function listTripReleaseChecklists(user: AuthUser, tripIds?: string[]) {
  const safeIds = (tripIds || []).filter(Boolean).slice(0, 250);
  if (!isAuthUserSuperuser(user) && safeIds.length === 0) return [];

  const rows = safeIds.length > 0
    ? await dbRows<ReleaseRow>(
        `SELECT release_id, trip_id, status, checks, blocking_reasons, override_reason,
          checked_by_user_id, checked_by_display_name, checked_at,
          approved_by_user_id, approved_by_display_name, approved_at, updated_at
         FROM logistics_trip_release_checklists
         WHERE trip_id IN (${safeIds.map(() => "?").join(", ")})`,
        safeIds,
      )
    : await dbRows<ReleaseRow>(
        `SELECT release_id, trip_id, status, checks, blocking_reasons, override_reason,
          checked_by_user_id, checked_by_display_name, checked_at,
          approved_by_user_id, approved_by_display_name, approved_at, updated_at
         FROM logistics_trip_release_checklists ORDER BY updated_at DESC LIMIT 250`,
      );
  return rows.map(mapRelease);
}

export async function ensureTripReleaseChecklist(tripId: string, user: AuthUser, meta: Meta = {}) {
  const trip = await getTrip(tripId);
  const checks = {
    ...emptyChecks,
    driverAssigned: Boolean(trip.driver_user_id),
    vehicleAssigned: Boolean(trip.vehicle_id),
  };
  const blockingReasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => checkLabels[key as LogisticsReleaseCheckKey]);
  const releaseId = randomUUID();

  await dbTransaction(async (execute) => {
    await execute(
      `INSERT IGNORE INTO logistics_trip_release_checklists (
        release_id, trip_id, status, checks, blocking_reasons
       ) VALUES (?, ?, 'pending', ?, ?)`,
      [releaseId, tripId, checks, blockingReasons],
    );
    await audit(execute, user, "trip.release.initialized", tripId, null, { checks, blockingReasons }, meta);
  });

  const records = await listTripReleaseChecklists(user, [tripId]);
  return records[0];
}

function normalizeChecks(value: unknown, trip: TripRow): LogisticsReleaseChecks {
  const payload = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    driverAssigned: Boolean(trip.driver_user_id),
    vehicleAssigned: Boolean(trip.vehicle_id),
    medicalPassed: payload.medicalPassed === true,
    technicalPassed: payload.technicalPassed === true,
    vehicleDocumentsValid: payload.vehicleDocumentsValid === true,
    driverDocumentsValid: payload.driverDocumentsValid === true,
    noCriticalDefects: payload.noCriticalDefects === true,
    capacityCompliant: payload.capacityCompliant === true,
    requiredDocumentsGenerated: payload.requiredDocumentsGenerated === true,
  };
}

export async function saveTripReleaseChecklist(
  tripId: string,
  payloadValue: unknown,
  user: AuthUser,
  meta: Meta = {},
) {
  if (!isAuthUserSuperuser(user)) throw new Error("Только уполномоченный пользователь может оформить выпуск");
  const trip = await getTrip(tripId);
  if (trip.status !== "release_pending") throw new Error("Чек-лист заполняется только на этапе ожидания выпуска");

  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue)
    ? payloadValue as Record<string, unknown>
    : {};
  const checks = normalizeChecks(payload.checks, trip);
  const blockingReasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => checkLabels[key as LogisticsReleaseCheckKey]);
  const overrideReason = typeof payload.overrideReason === "string" ? payload.overrideReason.trim() : "";
  const status: LogisticsTripReleaseRecord["status"] = blockingReasons.length === 0
    ? "ready"
    : overrideReason ? "overridden" : "blocked";
  if (overrideReason && overrideReason.length < 10) throw new Error("Для аварийного допуска укажите подробную причину не короче 10 символов");

  const before = (await listTripReleaseChecklists(user, [tripId]))[0] ?? null;
  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_trip_release_checklists (
        release_id, trip_id, status, checks, blocking_reasons, override_reason,
        checked_by_user_id, checked_by_display_name, checked_at,
        approved_by_user_id, approved_by_display_name, approved_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3), ?, ?, CASE WHEN ? IN ('ready','overridden') THEN NOW(3) ELSE NULL END)
       ON DUPLICATE KEY UPDATE status = VALUES(status), checks = VALUES(checks),
        blocking_reasons = VALUES(blocking_reasons), override_reason = VALUES(override_reason),
        checked_by_user_id = VALUES(checked_by_user_id), checked_by_display_name = VALUES(checked_by_display_name),
        checked_at = NOW(3), approved_by_user_id = VALUES(approved_by_user_id),
        approved_by_display_name = VALUES(approved_by_display_name), approved_at = VALUES(approved_at)`,
      [randomUUID(), tripId, status, checks, blockingReasons, overrideReason || null,
        user.id, user.displayName, status === "ready" || status === "overridden" ? user.id : null,
        status === "ready" || status === "overridden" ? user.displayName : null, status],
    );
    await audit(execute, user, status === "overridden" ? "trip.release.overridden" : "trip.release.checked",
      tripId, before, { status, checks, blockingReasons, overrideReason: overrideReason || undefined },
      { ...meta, reason: overrideReason || meta.reason });
  });

  return (await listTripReleaseChecklists(user, [tripId]))[0];
}

async function assertTripReleaseApproved(tripId: string, user: AuthUser) {
  const release = (await listTripReleaseChecklists(user, [tripId]))[0];
  if (!release) throw new Error("Чек-лист выпуска не создан");
  if (release.status !== "ready" && release.status !== "overridden") {
    throw new Error(`Выезд заблокирован: ${release.blockingReasons.join("; ") || "проверки выпуска не завершены"}`);
  }
}

export async function transitionLogisticsTripWithReleaseGuard(
  tripId: string,
  nextStatus: LogisticsTripStatus,
  payloadValue: unknown,
  user: AuthUser,
  meta: Meta = {},
) {
  if (nextStatus === "release_pending") {
    await ensureTripReleaseChecklist(tripId, user, meta);
  }
  if (nextStatus === "ready") {
    await assertTripReleaseApproved(tripId, user);
  }
  return transitionLogisticsTrip(tripId, nextStatus, payloadValue, user, meta);
}
