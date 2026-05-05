import { createHmac, timingSafeEqual } from "node:crypto";

import type { AuthSession, AuthUser } from "../../domain/auth/types";
import { getAuthUserById } from "./users";
import { authRequired, authSessionCookieName, getAuthSessionSecret } from "./config";

const sessionTtlMs = 1000 * 60 * 60 * 12;

type AuthCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
};

type AuthSessionPayload = {
  userId: string;
  expiresAt: string;
};

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function parseBase64UrlJson<T>(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSessionSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = Buffer.from(signPayload(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function createAuthSessionCookieValue(user: AuthUser) {
  const payload = base64UrlJson({
    userId: user.id,
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
  } satisfies AuthSessionPayload);
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function authSessionCookieOptions(): AuthCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(sessionTtlMs / 1000),
  };
}

export function expiredAuthSessionCookieOptions(): AuthCookieOptions {
  return {
    ...authSessionCookieOptions(),
    maxAge: 0,
  };
}

async function resolveAuthSessionCookie(value: string | undefined): Promise<AuthSession | null> {
  if (!authRequired()) return null;
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature || !verifySignature(payload, signature)) return null;

  try {
    const parsed = parseBase64UrlJson<AuthSessionPayload>(payload);
    const expiresAt = new Date(parsed.expiresAt);
    if (!parsed.userId || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return null;

    const user = await getAuthUserById(parsed.userId);
    return user ? { user, expiresAt: expiresAt.toISOString() } : null;
  } catch {
    return null;
  }
}

export function getAuthSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${authSessionCookieName}=`))
    ?.slice(authSessionCookieName.length + 1);

  return resolveAuthSessionCookie(cookieValue);
}

export function getAuthSessionFromCookieValue(cookieValue: string | undefined) {
  return resolveAuthSessionCookie(cookieValue);
}
