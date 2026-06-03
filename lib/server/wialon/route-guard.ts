import { NextResponse } from "next/server";

import { canAuthUserEditTab, canAuthUserViewTab, isAuthUserSuperuser } from "@/lib/domain/auth/types";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";

function canUseWialonLocal(session: Awaited<ReturnType<typeof getAuthSessionFromRequest>>) {
  const user = session?.user;
  if (!user) return false;
  if (isAuthUserSuperuser(user)) return true;
  if (user.canManageUsers) return true;

  return canAuthUserEditTab(user, "tb")
    || canAuthUserEditTab(user, "fleet")
    || canAuthUserEditTab(user, "admin")
    || canAuthUserViewTab(user, "tb")
    || canAuthUserViewTab(user, "fleet");
}

export async function requireWialonAdmin(request: Request) {
  const session = await getAuthSessionFromRequest(request);
  if (!canUseWialonLocal(session)) {
    return NextResponse.json({ error: "Недостаточно прав для Wialon Local" }, { status: 403 });
  }

  return null;
}

export function getWialonRequestErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Wialon request failed";
  const status = message.includes("WIALON_TOKEN") ? 503 : 502;

  return NextResponse.json({ error: message }, { status });
}
