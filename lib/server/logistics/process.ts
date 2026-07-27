import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthUser } from "../../domain/auth/types";
import { isAuthUserSuperuser } from "../../domain/auth/types";
import type { LogisticsTripRecord, LogisticsTripStatus } from "../../domain/logistics/types";
import { dbRows, dbTransaction } from "../mysql/pool";

type Meta = { ip?: string; userAgent?: string; correlationId?: string; reason?: string };
type RequestRow = RowDataPacket & {
  request_id: string;
  request_number: string;
  version: number;
  status: string;
  author_user_id: string;
  author_display_name: string;
  desired_departure_at: Date | null;
  desired_return_at: Date | null;
};
type TripRow = RowDataPacket & {
  trip_id: string;
  trip_number: string;
  status: LogisticsTripStatus;
  vehicle_id: string | null;
  driver_user_id: string | null;
  planned_departure_at: Date | null;
  planned_return_at: Date | null;
  actual_departure_at: Date | null;
  actual_return_at: Date | null;
  planned_distance_km: string | number | null;
  actual_distance_km: string | number | null;
  planned_fuel_liters: string | number | null;
  actual_fuel_liters: string | number | null;
  created_at: Date;
  updated_at: Date;
  request_id: string | null;
  request_number: string | null;
};

const tripTransitions: Record<LogisticsTripStatus, readonly LogisticsTripStatus[]> = {
  planned: ["release_pending", "cancelled"],
  release_pending: ["ready", "cancelled"],
  ready: ["in_progress", "cancelled"],
  in_progress: ["closing", "cancelled"],
  closing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function iso(value: Date | null) { return value ? value.toISOString() : undefined; }
function num(value: string | number | null) { if (value === null) return undefined; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function optionalNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label}: требуется неотрицательное число`);
  return parsed;
}
function dateTime(value: unknown, label: string) {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new Error(`${label}: некорректная дата`);
  return date.toISOString();
}

async function audit(
  execute: Parameters<Parameters<typeof dbTransaction>[0]>[0],
  user: AuthUser,
  eventType: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  meta: Meta,
) {
  await execute(
    `INSERT INTO logistics_audit_events (
      audit_id, actor_user_id, actor_display_name, event_type, entity_type, entity_id,
      reason, before_snapshot, after_snapshot, source, correlation_id, request_ip, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ui', ?, ?, ?)`,
    [randomUUID(), user.id, user.displayName, eventType, entityType, entityId, meta.reason ?? null,
      before ?? null, after ?? null, meta.correlationId ?? randomUUID(), meta.ip ?? null, meta.userAgent ?? null],
  );
}

async function getRequest(requestId: string) {
  const [row] = await dbRows<RequestRow>(
    `SELECT request_id, request_number, version, status, author_user_id, author_display_name,
      desired_departure_at, desired_return_at
     FROM logistics_requests WHERE request_id = ? LIMIT 1`,
    [requestId],
  );
  if (!row) throw new Error("Заявка не найдена");
  return row;
}

export async function submitLogisticsRequest(requestId: string, user: AuthUser, meta: Meta = {}) {
  const request = await getRequest(requestId);
  if (request.author_user_id !== user.id && !isAuthUserSuperuser(user)) throw new Error("Недостаточно прав для отправки заявки");
  if (request.status !== "draft" && request.status !== "returned") throw new Error("На согласование можно отправить только черновик или возвращённую заявку");

  const approvalId = randomUUID();
  const stepId = randomUUID();
  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_approvals (approval_id, request_id, request_version_no, status, started_at)
       VALUES (?, ?, ?, 'pending', NOW(3))`,
      [approvalId, requestId, request.version],
    );
    await execute(
      `INSERT INTO logistics_approval_steps (
        step_id, approval_id, sequence_no, step_name, role_code, decision, deadline_at
       ) VALUES (?, ?, 1, 'Утверждение заявки', 'dispatch-chief', 'pending', DATE_ADD(NOW(3), INTERVAL 24 HOUR))`,
      [stepId, approvalId],
    );
    await execute("UPDATE logistics_requests SET status = 'submitted', submitted_at = NOW(3) WHERE request_id = ?", [requestId]);
    await audit(execute, user, "approval.started", "logistics_request", requestId,
      { status: request.status }, { status: "submitted", approvalId }, meta);
  });
  return { requestId, approvalId, status: "submitted" as const };
}

export async function decideLogisticsApproval(
  requestId: string,
  decision: "approved" | "returned" | "rejected",
  user: AuthUser,
  meta: Meta = {},
) {
  if (!isAuthUserSuperuser(user)) throw new Error("Только уполномоченный пользователь может принять решение");
  const request = await getRequest(requestId);
  if (request.status !== "submitted") throw new Error("Заявка не находится на согласовании");
  const approvalRows = await dbRows<RowDataPacket & { approval_id: string }>(
    `SELECT approval_id FROM logistics_approvals
     WHERE request_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`,
    [requestId],
  );
  const approval = approvalRows[0];
  if (!approval) throw new Error("Активное согласование не найдено");
  if ((decision === "returned" || decision === "rejected") && !meta.reason) throw new Error("Укажите причину решения");

  const approvalStatus = decision === "approved" ? "approved" : decision;
  await dbTransaction(async (execute) => {
    await execute(
      `UPDATE logistics_approval_steps
       SET assignee_user_id = ?, decision = ?, comment = ?, decided_at = NOW(3)
       WHERE approval_id = ? AND decision = 'pending'`,
      [user.id, decision, meta.reason ?? null, approval.approval_id],
    );
    await execute(
      `UPDATE logistics_approvals SET status = ?, completed_at = NOW(3) WHERE approval_id = ?`,
      [approvalStatus, approval.approval_id],
    );
    await execute(
      `UPDATE logistics_requests SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW(3) ELSE approved_at END
       WHERE request_id = ?`,
      [decision, decision, requestId],
    );
    await audit(execute, user, `approval.${decision}`, "logistics_request", requestId,
      { status: "submitted", approvalId: approval.approval_id },
      { status: decision, approvalId: approval.approval_id, comment: meta.reason ?? null }, meta);
  });
  return { requestId, approvalId: approval.approval_id, status: decision };
}

export async function listLogisticsTrips(user: AuthUser, limit = 100): Promise<LogisticsTripRecord[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
  const rows = isAuthUserSuperuser(user)
    ? await dbRows<TripRow>(
        `SELECT t.trip_id, t.trip_number, t.status, t.vehicle_id, t.driver_user_id,
          t.planned_departure_at, t.planned_return_at, t.actual_departure_at, t.actual_return_at,
          t.planned_distance_km, t.actual_distance_km, t.planned_fuel_liters, t.actual_fuel_liters,
          t.created_at, t.updated_at, tr.request_id, r.request_number
         FROM logistics_trips t
         LEFT JOIN logistics_trip_requests tr ON tr.trip_id = t.trip_id
         LEFT JOIN logistics_requests r ON r.request_id = tr.request_id
         ORDER BY t.created_at DESC LIMIT ?`, [safeLimit])
    : await dbRows<TripRow>(
        `SELECT t.trip_id, t.trip_number, t.status, t.vehicle_id, t.driver_user_id,
          t.planned_departure_at, t.planned_return_at, t.actual_departure_at, t.actual_return_at,
          t.planned_distance_km, t.actual_distance_km, t.planned_fuel_liters, t.actual_fuel_liters,
          t.created_at, t.updated_at, tr.request_id, r.request_number
         FROM logistics_trips t
         JOIN logistics_trip_requests tr ON tr.trip_id = t.trip_id
         JOIN logistics_requests r ON r.request_id = tr.request_id
         WHERE r.author_user_id = ? OR t.driver_user_id = ?
         ORDER BY t.created_at DESC LIMIT ?`, [user.id, user.id, safeLimit]);

  return rows.map((row) => ({
    id: row.trip_id,
    number: row.trip_number,
    status: row.status,
    vehicleId: row.vehicle_id ?? undefined,
    driverUserId: row.driver_user_id ?? undefined,
    plannedDepartureAt: iso(row.planned_departure_at),
    plannedReturnAt: iso(row.planned_return_at),
    actualDepartureAt: iso(row.actual_departure_at),
    actualReturnAt: iso(row.actual_return_at),
    plannedDistanceKm: num(row.planned_distance_km),
    actualDistanceKm: num(row.actual_distance_km),
    plannedFuelLiters: num(row.planned_fuel_liters),
    actualFuelLiters: num(row.actual_fuel_liters),
    requestId: row.request_id ?? undefined,
    requestNumber: row.request_number ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function createLogisticsTrip(payloadValue: unknown, user: AuthUser, meta: Meta = {}) {
  if (!isAuthUserSuperuser(user)) throw new Error("Только диспетчер с полномочиями может создать рейс");
  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue)
    ? payloadValue as Record<string, unknown> : {};
  const requestId = text(payload.requestId);
  if (!requestId) throw new Error("Не указана заявка");
  const request = await getRequest(requestId);
  if (request.status !== "approved") throw new Error("Рейс создаётся только по согласованной заявке");

  const plannedDepartureAt = dateTime(payload.plannedDepartureAt, "Плановый выезд") || iso(request.desired_departure_at);
  const plannedReturnAt = dateTime(payload.plannedReturnAt, "Плановое возвращение") || iso(request.desired_return_at);
  if (plannedDepartureAt && plannedReturnAt && new Date(plannedReturnAt) < new Date(plannedDepartureAt)) {
    throw new Error("Плановое возвращение не может быть раньше выезда");
  }
  const tripId = randomUUID();
  const tripNumber = `Р-${new Date().getFullYear()}-${tripId.slice(0, 8).toUpperCase()}`;
  const vehicleId = text(payload.vehicleId) || undefined;
  const driverUserId = text(payload.driverUserId) || undefined;
  const plannedDistanceKm = optionalNumber(payload.plannedDistanceKm, "Плановый пробег");
  const plannedFuelLiters = optionalNumber(payload.plannedFuelLiters, "Плановое топливо");

  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_trips (
        trip_id, trip_number, status, vehicle_id, driver_user_id, planned_departure_at,
        planned_return_at, planned_distance_km, planned_fuel_liters, created_by_user_id
       ) VALUES (?, ?, 'planned', ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, tripNumber, vehicleId ?? null, driverUserId ?? null, plannedDepartureAt ?? null,
        plannedReturnAt ?? null, plannedDistanceKm ?? null, plannedFuelLiters ?? null, user.id],
    );
    await execute("INSERT INTO logistics_trip_requests (trip_id, request_id) VALUES (?, ?)", [tripId, requestId]);
    await execute("UPDATE logistics_requests SET status = 'planned' WHERE request_id = ?", [requestId]);
    await audit(execute, user, "trip.created", "logistics_trip", tripId, null,
      { tripId, tripNumber, requestId, vehicleId, driverUserId, plannedDepartureAt, plannedReturnAt, plannedDistanceKm, plannedFuelLiters }, meta);
  });
  return { tripId, tripNumber, requestId, status: "planned" as const };
}

export async function transitionLogisticsTrip(
  tripId: string,
  nextStatus: LogisticsTripStatus,
  payloadValue: unknown,
  user: AuthUser,
  meta: Meta = {},
) {
  const [trip] = await dbRows<TripRow>(
    `SELECT t.trip_id, t.trip_number, t.status, t.vehicle_id, t.driver_user_id,
      t.planned_departure_at, t.planned_return_at, t.actual_departure_at, t.actual_return_at,
      t.planned_distance_km, t.actual_distance_km, t.planned_fuel_liters, t.actual_fuel_liters,
      t.created_at, t.updated_at, tr.request_id, r.request_number
     FROM logistics_trips t
     LEFT JOIN logistics_trip_requests tr ON tr.trip_id = t.trip_id
     LEFT JOIN logistics_requests r ON r.request_id = tr.request_id
     WHERE t.trip_id = ? LIMIT 1`, [tripId]);
  if (!trip) throw new Error("Рейс не найден");
  if (!isAuthUserSuperuser(user) && trip.driver_user_id !== user.id) throw new Error("Недостаточно прав для изменения рейса");
  if (!tripTransitions[trip.status].includes(nextStatus)) throw new Error(`Переход рейса ${trip.status} → ${nextStatus} не разрешён`);
  if (nextStatus === "cancelled" && !meta.reason) throw new Error("Укажите причину отмены рейса");

  const payload = payloadValue && typeof payloadValue === "object" && !Array.isArray(payloadValue)
    ? payloadValue as Record<string, unknown> : {};
  const actualDistanceKm = optionalNumber(payload.actualDistanceKm, "Фактический пробег");
  const actualFuelLiters = optionalNumber(payload.actualFuelLiters, "Фактическое топливо");
  const requestStatus = nextStatus === "in_progress" ? "in_progress"
    : nextStatus === "completed" ? "completed"
      : nextStatus === "cancelled" ? "cancelled" : null;

  await dbTransaction(async (execute) => {
    await execute(
      `UPDATE logistics_trips SET status = ?,
        actual_departure_at = CASE WHEN ? = 'in_progress' AND actual_departure_at IS NULL THEN NOW(3) ELSE actual_departure_at END,
        actual_return_at = CASE WHEN ? = 'completed' THEN NOW(3) ELSE actual_return_at END,
        actual_distance_km = COALESCE(?, actual_distance_km),
        actual_fuel_liters = COALESCE(?, actual_fuel_liters)
       WHERE trip_id = ?`,
      [nextStatus, nextStatus, nextStatus, actualDistanceKm ?? null, actualFuelLiters ?? null, tripId],
    );
    if (requestStatus && trip.request_id) {
      await execute("UPDATE logistics_requests SET status = ? WHERE request_id = ?", [requestStatus, trip.request_id]);
    }
    await audit(execute, user, "trip.status.changed", "logistics_trip", tripId,
      { status: trip.status }, { status: nextStatus, actualDistanceKm, actualFuelLiters }, meta);
  });
  return { tripId, previousStatus: trip.status, status: nextStatus };
}
