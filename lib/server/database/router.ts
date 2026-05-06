import { NextResponse } from "next/server";
import { databaseResourceHandlers } from "./handlers";
import { authorizeDatabaseRequest } from "./authorization";
import {
  corsHeaders,
  createDatabaseAuthRequiredResponse,
  createDatabaseErrorResponse,
  createDatabaseForbiddenResponse,
  createDatabaseWriteGuardResponse,
  createUnknownDatabaseActionResponse,
  isAllowedCorsOrigin,
  json,
} from "./responses";
import {
  createDatabaseStatusPayload,
  createDatabaseStatusResponse,
  isDatabaseStatusRequest,
} from "./status";
import type { DatabaseRequest, DatabaseResourceHandler } from "./types";
import { authRequired } from "../auth/config";
import { getAuthSessionFromRequest } from "../auth/session";

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

function getFirstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function getRequestOriginCandidates(request: Request) {
  const candidates = new Set<string>();
  const requestOrigin = getUrlOrigin(request.url);
  if (requestOrigin) candidates.add(requestOrigin);

  const forwardedHost = getFirstForwardedValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost ?? request.headers.get("host") ?? undefined;
  if (host) {
    const requestProtocol = request.url.startsWith("https:") ? "https" : "http";
    const protocol = getFirstForwardedValue(request.headers.get("x-forwarded-proto")) ?? requestProtocol;
    candidates.add(`${protocol}://${host}`);
  }

  return candidates;
}

function isTrustedWriteOrigin(origin: string | undefined, requestOrigins: Set<string>) {
  return Boolean(origin && (requestOrigins.has(origin) || isAllowedCorsOrigin(origin)));
}

function isDatabaseWriteAction(action?: string) {
  const normalizedAction = action?.trim().toLowerCase() ?? "";
  return databaseWriteActionPrefixes.some((prefix) => normalizedAction.startsWith(prefix));
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function hasSameOriginFetchMarker(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");

  return request.headers.get("x-dispatcher-request") === "same-origin"
    && (fetchSite === "same-origin" || fetchSite === "same-site");
}

function hasSameOriginWriteHeaders(request: Request) {
  if (hasSameOriginFetchMarker(request)) return true;

  const requestOrigins = getRequestOriginCandidates(request);
  if (requestOrigins.size === 0) return false;

  const originHeader = request.headers.get("origin");
  const origin = getUrlOrigin(originHeader);
  if (originHeader && !isTrustedWriteOrigin(origin, requestOrigins)) return false;

  const refererHeader = request.headers.get("referer");
  const referer = getUrlOrigin(refererHeader);
  if (refererHeader && !isTrustedWriteOrigin(referer, requestOrigins)) return false;

  return isTrustedWriteOrigin(origin, requestOrigins) || isTrustedWriteOrigin(referer, requestOrigins);
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

  const requiresAuth = authRequired();
  const session = requiresAuth ? await getAuthSessionFromRequest(request) : null;
  if (requiresAuth && !session) {
    return createDatabaseAuthRequiredResponse(request);
  }

  if (session && !authorizeDatabaseRequest(session.user, { resource, action, payload }).allowed) {
    return createDatabaseForbiddenResponse(request);
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
