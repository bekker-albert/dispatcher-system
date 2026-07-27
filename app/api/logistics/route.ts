import { NextResponse } from "next/server";

import type { LogisticsRequestStatus } from "@/lib/domain/logistics/types";
import { authRequired, getAuthDisabledUser } from "@/lib/server/auth/config";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import {
  createLogisticsRequest,
  getLogisticsBootstrap,
  transitionLogisticsRequest,
} from "@/lib/server/logistics/repository";

export const dynamic = "force-dynamic";

type LogisticsApiBody = {
  action?: string;
  payload?: unknown;
};

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
  const status = /Недостаточно прав|Только уполномоченный/.test(message) ? 403
    : /не найдена/i.test(message) ? 404
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });

  try {
    const data = await getLogisticsBootstrap(user);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
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
  const meta = {
    ip: getRequestIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
    correlationId: request.headers.get("x-correlation-id") ?? undefined,
  };

  try {
    if (body.action === "create-request") {
      const requestRecord = await createLogisticsRequest(body.payload, user, meta);
      return NextResponse.json({ request: requestRecord }, { status: 201 });
    }

    if (body.action === "transition-request") {
      const payload = body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
        ? body.payload as Record<string, unknown>
        : {};
      const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
      const status = typeof payload.status === "string" ? payload.status as LogisticsRequestStatus : undefined;
      if (!requestId || !status) throw new Error("Не указана заявка или новый статус");
      const result = await transitionLogisticsRequest(requestId, status, user, {
        ...meta,
        reason: typeof payload.reason === "string" ? payload.reason.trim() || undefined : undefined,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Неизвестное действие логистики" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
