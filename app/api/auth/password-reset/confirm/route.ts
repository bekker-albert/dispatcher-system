import { NextResponse } from "next/server";

import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { confirmPasswordReset } from "@/lib/server/auth/password-reset";

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
