import { NextResponse } from "next/server";

import type { AuthPasswordResetChannel } from "@/lib/domain/auth/types";
import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { requestPasswordReset } from "@/lib/server/auth/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PasswordResetRequestBody = {
  login?: unknown;
  channel?: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getChannel(value: unknown): AuthPasswordResetChannel {
  return value === "phone" ? "phone" : "email";
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const body = await request.json().catch(() => ({})) as PasswordResetRequestBody;
  try {
    const result = await requestPasswordReset({
      login: getString(body.login),
      channel: getChannel(body.channel),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Код не отправлен";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
