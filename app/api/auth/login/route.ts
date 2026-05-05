import { NextResponse } from "next/server";

import { authSessionCookieName } from "@/lib/server/auth/config";
import {
  authSessionCookieOptions,
  createAuthSessionCookieValue,
} from "@/lib/server/auth/session";
import {
  checkAuthLoginRateLimit,
  clearAuthLoginRateLimit,
  createAuthLoginRateLimitKey,
  recordFailedAuthAttempt,
} from "@/lib/server/auth/rate-limit";
import { authenticateAuthUser } from "@/lib/server/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LoginRequestBody = {
  login?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as LoginRequestBody;
  const login = typeof body.login === "string" ? body.login : "";
  const password = typeof body.password === "string" ? body.password : "";
  const rateLimitKey = createAuthLoginRateLimitKey(request, login);
  const rateLimit = checkAuthLoginRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const user = await authenticateAuthUser(login, password);

  if (!user) {
    recordFailedAuthAttempt(rateLimitKey);
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  clearAuthLoginRateLimit(rateLimitKey);
  const response = NextResponse.json({ user });
  response.cookies.set(authSessionCookieName, createAuthSessionCookieValue(user), authSessionCookieOptions());

  return response;
}
