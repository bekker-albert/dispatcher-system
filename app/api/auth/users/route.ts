import { NextResponse } from "next/server";

import type { AuthTabPermissions, AuthUserRole } from "@/lib/domain/auth/types";
import { normalizeAuthTabPermissions, normalizeAuthUserRole } from "@/lib/domain/auth/types";
import { createAuthMutationRejectedResponse, isAuthMutationAllowed } from "@/lib/server/auth/request-guard";
import { getAuthSessionFromRequest } from "@/lib/server/auth/session";
import { createAuthUser, deleteAuthUser, listAuthUsers, updateAuthUser } from "@/lib/server/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateUserRequestBody = {
  login?: unknown;
  displayName?: unknown;
  lastName?: unknown;
  firstName?: unknown;
  middleName?: unknown;
  email?: unknown;
  phone?: unknown;
  positionTitle?: unknown;
  password?: unknown;
  role?: unknown;
  canManageUsers?: unknown;
  tabPermissions?: unknown;
};

type UpdateUserRequestBody = CreateUserRequestBody & {
  id?: unknown;
  active?: unknown;
};

type DeleteUserRequestBody = {
  id?: unknown;
};

function requireUserManager(session: Awaited<ReturnType<typeof getAuthSessionFromRequest>>) {
  return Boolean(session?.user.canManageUsers);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getProfilePayload(body: CreateUserRequestBody) {
  return {
    displayName: getString(body.displayName),
    lastName: getString(body.lastName),
    firstName: getString(body.firstName),
    middleName: getString(body.middleName),
    email: getString(body.email),
    phone: getString(body.phone),
    positionTitle: getString(body.positionTitle),
  };
}

function getTabPermissions(value: unknown): AuthTabPermissions {
  return normalizeAuthTabPermissions(value);
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
  const login = getString(body.login);
  const password = getString(body.password);
  const role: AuthUserRole = normalizeAuthUserRole(body.role);
  const canManageUsers = Boolean(body.canManageUsers);

  try {
    const user = await createAuthUser({
      login,
      ...getProfilePayload(body),
      password,
      role,
      canManageUsers,
      tabPermissions: getTabPermissions(body.tabPermissions),
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пользователь не создан";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const session = await getAuthSessionFromRequest(request);
  const body = await request.json().catch(() => ({})) as UpdateUserRequestBody;
  const id = getString(body.id);
  const isSelfUpdate = Boolean(session?.user.id && session.user.id === id);

  if (!requireUserManager(session) && !isSelfUpdate) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const manager = requireUserManager(session);
  const password = getString(body.password) || undefined;
  const role: AuthUserRole = normalizeAuthUserRole(body.role);
  const canManageUsers = Boolean(body.canManageUsers);
  const active = body.active !== false;

  if (manager && session?.user.id === id && !active) {
    return NextResponse.json({ error: "Нельзя заблокировать свою учетную запись" }, { status: 400 });
  }

  try {
    const user = await updateAuthUser({
      id,
      ...getProfilePayload(body),
      password,
      role: manager ? role : undefined,
      canManageUsers: manager ? canManageUsers : undefined,
      active: manager ? active : undefined,
      tabPermissions: manager ? getTabPermissions(body.tabPermissions) : undefined,
    });
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пользователь не сохранен";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthMutationAllowed(request)) return createAuthMutationRejectedResponse();

  const session = await getAuthSessionFromRequest(request);
  if (!requireUserManager(session)) {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as DeleteUserRequestBody;
  const id = getString(body.id);

  try {
    await deleteAuthUser(id, session?.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пользователь не удален";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
