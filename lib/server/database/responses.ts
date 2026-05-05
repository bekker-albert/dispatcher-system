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
