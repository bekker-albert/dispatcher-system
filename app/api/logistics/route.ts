import { NextResponse } from "next/server";

import type { LogisticsTripStatus } from "@/lib/domain/logistics/types";
import { authRequired, getAuthDisabledUser } from "@/lib/server/auth/config";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import {
  createLogisticsRequest,
  getLogisticsBootstrap,
} from "@/lib/server/logistics/repository";
import {
  createLogisticsTrip,
  decideLogisticsApproval,
  listLogisticsTrips,
  submitLogisticsRequest,
} from "@/lib/server/logistics/process";
import {
  listTripReleaseChecklists,
  saveTripReleaseChecklist,
  transitionLogisticsTripWithReleaseGuard,
} from "@/lib/server/logistics/release";

export const dynamic = "force-dynamic";

type LogisticsApiBody = { action?: string; payload?: unknown };

function getRequestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || undefined;
}

function hasSameOriginMutationMarker(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  return request.headers.get("x-dispatcher-request") === "same-origin"
    && (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site");
}

async function getCurrentUser(request: Request) {
  if (!authRequired()) return getAuthDisabledUser();
  return (await getAuthSessionFromRequest(request))?.user ?? null;
}

function errorResponse(error: unknown, fallbackStatus = 400) {
  const message = error instanceof Error ? error.message : "Не удалось выполнить операцию";
  const status = /Недостаточно прав|Только уполномоченный|Только диспетчер/.test(message) ? 403
    : /не найдена|не найдено/i.test(message) ? 404
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

function record(payload: unknown) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
}
function requiredText(value: unknown, message: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new Error(message);
  return normalized;
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });

  try {
    const [bootstrap, trips] = await Promise.all([
      getLogisticsBootstrap(user),
      listLogisticsTrips(user, 100),
    ]);
    const releases = await listTripReleaseChecklists(user, trips.map((trip) => trip.id));
    return NextResponse.json({
      ...bootstrap,
      trips,
      releases,
      summary: {
        ...bootstrap.summary,
        activeTrips: trips.filter((trip) => trip.status !== "completed" && trip.status !== "cancelled").length,
        blockedReleases: releases.filter((release) => release.status === "blocked" || release.status === "pending").length,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  if (!hasSameOriginMutationMarker(request)) {
    return NextResponse.json({ error: "Запрос изменения отклонён проверкой источника" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as LogisticsApiBody;
  const payload = record(body.payload);
  const meta = {
    ip: getRequestIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
    reason: typeof payload.reason === "string" ? payload.reason.trim() || undefined : undefined,
  };

  try {
    if (body.action === "create-request") {
      const requestRecord = await createLogisticsRequest(body.payload, user, meta);
      return NextResponse.json({ request: requestRecord }, { status: 201 });
    }
    if (body.action === "submit-request") {
      const result = await submitLogisticsRequest(requiredText(payload.requestId, "Не указана заявка"), user, meta);
      return NextResponse.json(result);
    }
    if (body.action === "decide-request") {
      const decision = payload.decision;
      if (decision !== "approved" && decision !== "returned" && decision !== "rejected") throw new Error("Некорректное решение");
      const result = await decideLogisticsApproval(requiredText(payload.requestId, "Не указана заявка"), decision, user, meta);
      return NextResponse.json(result);
    }
    if (body.action === "create-trip") {
      const result = await createLogisticsTrip(body.payload, user, meta);
      return NextResponse.json(result, { status: 201 });
    }
    if (body.action === "save-trip-release") {
      const result = await saveTripReleaseChecklist(
        requiredText(payload.tripId, "Не указан рейс"),
        payload,
        user,
        meta,
      );
      return NextResponse.json({ release: result });
    }
    if (body.action === "transition-trip") {
      const status = payload.status as LogisticsTripStatus;
      if (!status) throw new Error("Не указан новый статус рейса");
      const result = await transitionLogisticsTripWithReleaseGuard(
        requiredText(payload.tripId, "Не указан рейс"),
        status,
        payload,
        user,
        meta,
      );
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Неизвестное действие логистики" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
