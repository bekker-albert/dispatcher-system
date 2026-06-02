import { NextResponse } from "next/server";

import { getAuthSessionFromRequest } from "@/lib/server/auth/session";

export async function requireWialonAdmin(request: Request) {
  const session = await getAuthSessionFromRequest(request);
  if (!session?.user.canManageUsers) {
    return NextResponse.json({ error: "Недостаточно прав для Wialon Local" }, { status: 403 });
  }

  return null;
}

export function getWialonRequestErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Wialon request failed";
  const status = message.includes("WIALON_TOKEN") ? 503 : 502;

  return NextResponse.json({ error: message }, { status });
}
