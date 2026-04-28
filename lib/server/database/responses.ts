import { NextResponse } from "next/server";
import { errorToMessage } from "../../utils/normalizers";
import { databaseConflictCode, isDatabaseConflictResponseError } from "./conflicts";
import { isDatabasePayloadError } from "./validation";

const corsAllowedOrigins = new Set([
  "https://aam-dispatch.kz",
  "https://www.aam-dispatch.kz",
]);

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Vary": "Origin",
  };

  if (corsAllowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
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
