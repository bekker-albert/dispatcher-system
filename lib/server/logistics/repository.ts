import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";

import type { AuthUser } from "../../domain/auth/types";
import { isAuthUserSuperuser } from "../../domain/auth/types";
import type {
  LogisticsRequestInput,
  LogisticsRequestRecord,
  LogisticsRequestStatus,
} from "../../domain/logistics/types";
import { dbExecute, dbRows, dbTransaction } from "../mysql/pool";

type RequestRow = RowDataPacket & {
  request_id: string;
  request_number: string;
  version: number;
  status: LogisticsRequestStatus;
  kind: LogisticsRequestInput["kind"];
  author_user_id: string;
  author_display_name: string;
  department: string | null;
  project: string | null;
  cost_center: string | null;
  purpose: string;
  priority: "normal" | "urgent" | "critical";
  desired_departure_at: Date | null;
  desired_return_at: Date | null;
  passenger_count: number | null;
  cargo_description: string | null;
  cargo_weight_kg: string | number | null;
  cargo_volume_m3: string | number | null;
  requires_business_trip: number;
  requires_waybill: number;
  requires_consignment_note: number;
  notes: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type StopRow = RowDataPacket & {
  request_id: string;
  sequence_no: number;
  stop_type: LogisticsRequestInput["stops"][number]["type"];
  name: string;
  address: string | null;
  planned_at: Date | null;
};

type CountRow = RowDataPacket & { total: number };

type RequestMeta = {
  ip?: string;
  userAgent?: string;
  correlationId?: string;
  reason?: string;
};

const allowedTransitions: Record<LogisticsRequestStatus, readonly LogisticsRequestStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["returned", "approved", "rejected", "cancelled"],
  returned: ["submitted", "cancelled"],
  approved: ["planned", "cancelled"],
  rejected: [],
  planned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function iso(value: Date | null) {
  return value ? value.toISOString() : undefined;
}

function numberOrUndefined(value: string | number | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOptionalText(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function normalizeDateTime(value: unknown) {
  const text = normalizeOptionalText(value);
  if (!text) return undefined;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`Некорректная дата: ${text}`);
  return date.toISOString();
}

function normalizeNonNegativeNumber(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label}: требуется неотрицательное число`);
  return parsed;
}

export function validateLogisticsRequestInput(value: unknown): LogisticsRequestInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Данные заявки не переданы");
  }

  const input = value as Record<string, unknown>;
  const kind = input.kind;
  if (kind !== "passengers" && kind !== "cargo" && kind !== "documents" && kind !== "mixed") {
    throw new Error("Выберите корректный тип перевозки");
  }

  const purpose = normalizeOptionalText(input.purpose);
  if (!purpose) throw new Error("Укажите цель поездки");

  const rawStops = Array.isArray(input.stops) ? input.stops : [];
  if (rawStops.length < 2) throw new Error("Укажите минимум две точки маршрута");

  const stops = rawStops.map((rawStop, index) => {
    if (!rawStop || typeof rawStop !== "object" || Array.isArray(rawStop)) {
      throw new Error(`Точка маршрута ${index + 1} заполнена некорректно`);
    }
    const stop = rawStop as Record<string, unknown>;
    const name = normalizeOptionalText(stop.name);
    if (!name) throw new Error(`Укажите название точки маршрута ${index + 1}`);
    const type = stop.type;
    if (type !== "origin" && type !== "loading" && type !== "waypoint" && type !== "unloading" && type !== "destination") {
      throw new Error(`Укажите тип точки маршрута ${index + 1}`);
    }
    return {
      sequence: index + 1,
      type,
      name,
      address: normalizeOptionalText(stop.address),
      plannedAt: normalizeDateTime(stop.plannedAt),
    };
  });

  const priority = input.priority === "urgent" || input.priority === "critical" ? input.priority : "normal";

  return {
    kind,
    purpose,
    project: normalizeOptionalText(input.project),
    department: normalizeOptionalText(input.department),
    costCenter: normalizeOptionalText(input.costCenter),
    priority,
    desiredDepartureAt: normalizeDateTime(input.desiredDepartureAt),
    desiredReturnAt: normalizeDateTime(input.desiredReturnAt),
    requiresBusinessTrip: input.requiresBusinessTrip === true,
    requiresWaybill: input.requiresWaybill === true,
    requiresConsignmentNote: input.requiresConsignmentNote === true,
    passengerCount: normalizeNonNegativeNumber(input.passengerCount, "Количество пассажиров"),
    cargoDescription: normalizeOptionalText(input.cargoDescription),
    cargoWeightKg: normalizeNonNegativeNumber(input.cargoWeightKg, "Масса груза"),
    cargoVolumeM3: normalizeNonNegativeNumber(input.cargoVolumeM3, "Объём груза"),
    notes: normalizeOptionalText(input.notes),
    stops,
  };
}

function mapRequest(row: RequestRow, stops: StopRow[]): LogisticsRequestRecord {
  return {
    id: row.request_id,
    number: row.request_number,
    version: row.version,
    status: row.status,
    kind: row.kind,
    authorUserId: row.author_user_id,
    authorDisplayName: row.author_display_name,
    department: row.department ?? undefined,
    project: row.project ?? undefined,
    costCenter: row.cost_center ?? undefined,
    purpose: row.purpose,
    priority: row.priority,
    desiredDepartureAt: iso(row.desired_departure_at),
    desiredReturnAt: iso(row.desired_return_at),
    passengerCount: row.passenger_count ?? undefined,
    cargoDescription: row.cargo_description ?? undefined,
    cargoWeightKg: numberOrUndefined(row.cargo_weight_kg),
    cargoVolumeM3: numberOrUndefined(row.cargo_volume_m3),
    requiresBusinessTrip: Boolean(row.requires_business_trip),
    requiresWaybill: Boolean(row.requires_waybill),
    requiresConsignmentNote: Boolean(row.requires_consignment_note),
    notes: row.notes ?? undefined,
    stops: stops
      .filter((stop) => stop.request_id === row.request_id)
      .sort((a, b) => a.sequence_no - b.sequence_no)
      .map((stop) => ({
        sequence: stop.sequence_no,
        type: stop.stop_type,
        name: stop.name,
        address: stop.address ?? undefined,
        plannedAt: iso(stop.planned_at),
      })),
    submittedAt: iso(row.submitted_at),
    approvedAt: iso(row.approved_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function appendAuditEvent(
  execute: Parameters<Parameters<typeof dbTransaction>[0]>[0] | typeof dbExecute,
  user: AuthUser,
  eventType: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  meta: RequestMeta,
) {
  const auditId = randomUUID();
  await execute(
    `INSERT INTO logistics_audit_events (
      audit_id, actor_user_id, actor_display_name, event_type, entity_type, entity_id,
      reason, before_snapshot, after_snapshot, source, correlation_id, request_ip, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ui', ?, ?, ?)`,
    [
      auditId,
      user.id,
      user.displayName,
      eventType,
      entityType,
      entityId,
      meta.reason ?? null,
      before ?? null,
      after ?? null,
      meta.correlationId ?? randomUUID(),
      meta.ip ?? null,
      meta.userAgent ?? null,
    ],
  );
}

export async function listLogisticsRequests(user: AuthUser, limit = 100) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 250);
  const rows = isAuthUserSuperuser(user)
    ? await dbRows<RequestRow>(
        `SELECT request_id, request_number, version, status, kind, author_user_id, author_display_name,
          department, project, cost_center, purpose, priority, desired_departure_at, desired_return_at,
          passenger_count, cargo_description, cargo_weight_kg, cargo_volume_m3,
          requires_business_trip, requires_waybill, requires_consignment_note, notes,
          submitted_at, approved_at, created_at, updated_at
        FROM logistics_requests ORDER BY created_at DESC LIMIT ?`,
        [safeLimit],
      )
    : await dbRows<RequestRow>(
        `SELECT request_id, request_number, version, status, kind, author_user_id, author_display_name,
          department, project, cost_center, purpose, priority, desired_departure_at, desired_return_at,
          passenger_count, cargo_description, cargo_weight_kg, cargo_volume_m3,
          requires_business_trip, requires_waybill, requires_consignment_note, notes,
          submitted_at, approved_at, created_at, updated_at
        FROM logistics_requests WHERE author_user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [user.id, safeLimit],
      );

  if (rows.length === 0) return [];
  const requestIds = rows.map((row) => row.request_id);
  const placeholders = requestIds.map(() => "?").join(", ");
  const stops = await dbRows<StopRow>(
    `SELECT request_id, sequence_no, stop_type, name, address, planned_at
     FROM logistics_request_stops WHERE request_id IN (${placeholders}) ORDER BY request_id, sequence_no`,
    requestIds,
  );
  return rows.map((row) => mapRequest(row, stops));
}

export async function getLogisticsBootstrap(user: AuthUser) {
  const requests = await listLogisticsRequests(user, 100);
  const [tripCount] = await dbRows<CountRow>("SELECT COUNT(*) AS total FROM logistics_trips");
  const [templateCount] = await dbRows<CountRow>("SELECT COUNT(*) AS total FROM logistics_document_templates WHERE status = 'active'");
  const [draftConfigCount] = await dbRows<CountRow>("SELECT COUNT(*) AS total FROM logistics_config_versions WHERE status = 'draft'");
  return {
    user,
    requests,
    summary: {
      totalRequests: requests.length,
      pendingRequests: requests.filter((request) => request.status === "submitted").length,
      activeTrips: Number(tripCount?.total ?? 0),
      activeTemplates: Number(templateCount?.total ?? 0),
      draftConfigurations: Number(draftConfigCount?.total ?? 0),
    },
  };
}

export async function createLogisticsRequest(inputValue: unknown, user: AuthUser, meta: RequestMeta = {}) {
  const input = validateLogisticsRequestInput(inputValue);
  const requestId = randomUUID();
  const requestNumber = `ЗГ-${new Date().getFullYear()}-${requestId.slice(0, 8).toUpperCase()}`;
  const snapshot = {
    ...input,
    id: requestId,
    number: requestNumber,
    version: 1,
    status: "draft" as const,
    authorUserId: user.id,
    authorDisplayName: user.displayName,
  };

  await dbTransaction(async (execute) => {
    await execute(
      `INSERT INTO logistics_requests (
        request_id, request_number, version, status, kind, author_user_id, author_display_name,
        department, project, cost_center, purpose, priority, desired_departure_at, desired_return_at,
        passenger_count, cargo_description, cargo_weight_kg, cargo_volume_m3,
        requires_business_trip, requires_waybill, requires_consignment_note, notes
      ) VALUES (?, ?, 1, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        requestNumber,
        input.kind,
        user.id,
        user.displayName,
        input.department ?? null,
        input.project ?? null,
        input.costCenter ?? null,
        input.purpose,
        input.priority ?? "normal",
        input.desiredDepartureAt ?? null,
        input.desiredReturnAt ?? null,
        input.passengerCount ?? null,
        input.cargoDescription ?? null,
        input.cargoWeightKg ?? null,
        input.cargoVolumeM3 ?? null,
        input.requiresBusinessTrip ?? false,
        input.requiresWaybill ?? false,
        input.requiresConsignmentNote ?? false,
        input.notes ?? null,
      ],
    );

    for (const stop of input.stops) {
      await execute(
        `INSERT INTO logistics_request_stops (
          stop_id, request_id, sequence_no, stop_type, name, address, planned_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), requestId, stop.sequence, stop.type, stop.name, stop.address ?? null, stop.plannedAt ?? null],
      );
    }

    await execute(
      `INSERT INTO logistics_request_versions (
        version_id, request_id, version_no, snapshot, change_reason,
        created_by_user_id, created_by_display_name
      ) VALUES (?, ?, 1, ?, 'Создание заявки', ?, ?)`,
      [randomUUID(), requestId, snapshot, user.id, user.displayName],
    );

    await appendAuditEvent(execute, user, "request.created", "logistics_request", requestId, null, snapshot, meta);
  });

  const created = (await listLogisticsRequests(user, 250)).find((request) => request.id === requestId);
  if (!created) throw new Error("Созданная заявка не найдена");
  return created;
}

export async function transitionLogisticsRequest(
  requestId: string,
  nextStatus: LogisticsRequestStatus,
  user: AuthUser,
  meta: RequestMeta = {},
) {
  const rows = await dbRows<RequestRow>(
    `SELECT request_id, request_number, version, status, kind, author_user_id, author_display_name,
      department, project, cost_center, purpose, priority, desired_departure_at, desired_return_at,
      passenger_count, cargo_description, cargo_weight_kg, cargo_volume_m3,
      requires_business_trip, requires_waybill, requires_consignment_note, notes,
      submitted_at, approved_at, created_at, updated_at
    FROM logistics_requests WHERE request_id = ? LIMIT 1`,
    [requestId],
  );
  const current = rows[0];
  if (!current) throw new Error("Заявка не найдена");
  if (!isAuthUserSuperuser(user) && current.author_user_id !== user.id) throw new Error("Недостаточно прав для изменения заявки");
  if (!allowedTransitions[current.status].includes(nextStatus)) {
    throw new Error(`Переход ${current.status} → ${nextStatus} не разрешён`);
  }
  if ((nextStatus === "approved" || nextStatus === "rejected") && !isAuthUserSuperuser(user)) {
    throw new Error("Только уполномоченный пользователь может принять окончательное решение");
  }

  const submittedAt = nextStatus === "submitted" ? new Date().toISOString() : current.submitted_at;
  const approvedAt = nextStatus === "approved" ? new Date().toISOString() : current.approved_at;

  await dbTransaction(async (execute) => {
    await execute(
      "UPDATE logistics_requests SET status = ?, submitted_at = ?, approved_at = ? WHERE request_id = ?",
      [nextStatus, submittedAt ?? null, approvedAt ?? null, requestId],
    );
    await appendAuditEvent(
      execute,
      user,
      "request.status.changed",
      "logistics_request",
      requestId,
      { status: current.status },
      { status: nextStatus },
      meta,
    );
  });

  return { requestId, previousStatus: current.status, status: nextStatus };
}
