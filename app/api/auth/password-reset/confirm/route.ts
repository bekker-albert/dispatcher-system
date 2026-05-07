import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { confirmPasswordReset } from "@/lib/server/auth/password-reset";
import {
  checkAuthActionRateLimit,
  createAuthActionRateLimitKey,
  recordAuthActionAttempt,
} from "@/lib/server/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PasswordResetConfirmBody = {
  login?: unknown;
  code?: unknown;
  password?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const body = await request.json().catch(() => ({})) as PasswordResetConfirmBody;
  const rateLimitKey = createAuthActionRateLimitKey(request, "password-reset-confirm", getString(body.login));
  const rateLimit = checkAuthActionRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Слишком много попыток. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }
  recordAuthActionAttempt(rateLimitKey);

  try {
    await confirmPasswordReset({
      login: getString(body.login),
      code: getString(body.code),
      password: getString(body.password),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пароль не изменен";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
