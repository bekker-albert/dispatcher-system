import { NextResponse } from "next/server";

import { authSessionCookieName } from "@/lib/server/auth/config";
import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { expiredAuthSessionCookieOptions } from "@/lib/server/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authSessionCookieName, "", expiredAuthSessionCookieOptions());

  return response;
}
