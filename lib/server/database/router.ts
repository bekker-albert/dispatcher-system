import { NextResponse } from "next/server";
import { databaseResourceHandlers } from "./handlers";
import {
  corsHeaders,
  createDatabaseErrorResponse,
  createDatabaseWriteGuardResponse,
  createUnknownDatabaseActionResponse,
  json,
} from "./responses";
import {
  createDatabaseStatusPayload,
  createDatabaseStatusResponse,
  isDatabaseStatusRequest,
} from "./status";
import type { DatabaseRequest, DatabaseResourceHandler } from "./types";

export { createDatabaseErrorResponse } from "./responses";

type DatabaseResourceHandlers = Record<string, DatabaseResourceHandler>;

const databaseWriteActionPrefixes = ["save", "delete", "update", "set", "clear", "replace"] as const;

function getUrlOrigin(value: string | null) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function isDatabaseWriteAction(action?: string) {
  const normalizedAction = action?.trim().toLowerCase() ?? "";
  return databaseWriteActionPrefixes.some((prefix) => normalizedAction.startsWith(prefix));
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function hasSameOriginWriteHeaders(request: Request) {
  const requestOrigin = getUrlOrigin(request.url);
  if (!requestOrigin) return false;

  const originHeader = request.headers.get("origin");
  const origin = getUrlOrigin(originHeader);
  if (originHeader && origin !== requestOrigin) return false;

  const refererHeader = request.headers.get("referer");
  const referer = getUrlOrigin(refererHeader);
  if (refererHeader && referer !== requestOrigin) return false;

  return origin === requestOrigin || referer === requestOrigin;
}

function shouldRejectDatabaseWriteRequest(action: string | undefined, request: Request) {
  if (!isDatabaseWriteAction(action)) return false;

  const hasOriginContext = Boolean(request.headers.get("origin") || request.headers.get("referer"));
  const isSameOrigin = hasSameOriginWriteHeaders(request);

  return !isSameOrigin && (hasOriginContext || isProductionRuntime());
}

export async function handleDatabaseOptions(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function handleDatabaseGet(request: Request) {
  return json(createDatabaseStatusPayload(), 200, request);
}

export async function routeDatabaseRequest(
  body: DatabaseRequest,
  request: Request,
  handlers: DatabaseResourceHandlers = databaseResourceHandlers,
) {
  const { resource, action, payload } = body;
  const jsonForRequest = (data: unknown, status = 200) => json(data, status, request);

  if (isDatabaseStatusRequest(resource, action)) {
    return createDatabaseStatusResponse(jsonForRequest);
  }

  if (shouldRejectDatabaseWriteRequest(action, request)) {
    return createDatabaseWriteGuardResponse(request);
  }

  const handler = resource ? handlers[resource] : undefined;
  const response = handler
    ? await handler({ action, payload, request, json: jsonForRequest })
    : undefined;

  return response ?? createUnknownDatabaseActionResponse(request);
}

export function createDatabasePostHandler(handlers: DatabaseResourceHandlers = databaseResourceHandlers) {
  return async function handleDatabasePost(request: Request) {
    try {
      const body = await request.json().catch(() => ({})) as DatabaseRequest;
      return await routeDatabaseRequest(body, request, handlers);
    } catch (error) {
      return createDatabaseErrorResponse(error, request);
    }
  };
}

export const handleDatabasePost = createDatabasePostHandler();
