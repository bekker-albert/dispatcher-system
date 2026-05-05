import { NextResponse } from "next/server";

import type { AuthUserRole } from "@/lib/domain/auth/types";
import { normalizeAuthUserRole } from "@/lib/domain/auth/types";
import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import { createAuthUser, listAuthUsers } from "@/lib/server/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateUserRequestBody = {
  login?: unknown;
  displayName?: unknown;
  password?: unknown;
  role?: unknown;
  canManageUsers?: unknown;
};

function requireUserManager(session: Awaited<ReturnType<typeof getAuthSessionFromRequest>>) {
  return Boolean(session?.user.canManageUsers);
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest(request);
  if (!requireUserManager(session)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  return NextResponse.json({ users: await listAuthUsers() });
}

export async function POST(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const session = await getAuthSessionFromRequest(request);
  if (!requireUserManager(session)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as CreateUserRequestBody;
  const login = typeof body.login === "string" ? body.login : "";
  const displayName = typeof body.displayName === "string" ? body.displayName : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role: AuthUserRole = normalizeAuthUserRole(body.role);
  const canManageUsers = Boolean(body.canManageUsers);

  try {
    const user = await createAuthUser({ login, displayName, password, role, canManageUsers });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пользователь не создан";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
