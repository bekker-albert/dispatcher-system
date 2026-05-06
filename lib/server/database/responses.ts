import { NextResponse } from "next/server";
import { defaultDatabaseCorsAllowedOrigins } from "../../database/api-url";
import { errorToMessage } from "../../utils/normalizers";
import { databaseConflictCode, isDatabaseConflictResponseError } from "./conflicts";
import { isDatabasePayloadError } from "./validation";

function parseAllowedOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getCorsAllowedOrigins() {
  return new Set([
    ...defaultDatabaseCorsAllowedOrigins,
    ...parseAllowedOrigins(process.env.DATABASE_ALLOWED_ORIGINS),
  ]);
}

export function isAllowedCorsOrigin(origin: string | undefined) {
  return Boolean(origin && getCorsAllowedOrigins().has(origin));
}

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Vary": "Origin",
  };

  if (isAllowedCorsOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, X-Dispatcher-Request";
  }

  return headers;
}

export function json(data: unknown, status = 200, request?: Request) {
  return NextResponse.json({ data }, { status, headers: corsHeaders(request) });
}

export function createDatabaseErrorResponse(error: unknown, request?: Request) {
  const message = errorToMessage(error);
  const conflict = isDatabaseConflictResponseError(error);
  return NextResponse.json(
    conflict ? { error: message, code: databaseConflictCode } : { error: message },
    { status: conflict ? 409 : isDatabasePayloadError(error) ? 400 : 500, headers: corsHeaders(request) },
  );
}

export function createDatabaseForbiddenResponse(request?: Request) {
  return NextResponse.json(
    { error: "\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u043f\u0440\u0430\u0432 \u0434\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f." },
    { status: 403, headers: corsHeaders(request) },
  );
}

export function createUnknownDatabaseActionResponse(request?: Request) {
  return NextResponse.json(
    { error: "Неизвестное действие базы данных." },
    { status: 400, headers: corsHeaders(request) },
  );
}

export function createDatabaseWriteGuardResponse(request?: Request) {
  return NextResponse.json(
    { error: "Запись в базу данных отклонена: запрос должен идти с этого же сайта." },
    { status: 403, headers: corsHeaders(request) },
  );
}

export function createDatabaseAuthRequiredResponse(request?: Request) {
  return NextResponse.json(
    { error: "Нужно войти в систему." },
    { status: 401, headers: corsHeaders(request) },
  );
}
