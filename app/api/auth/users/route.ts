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

function getBooleanField(value: unknown, fieldName: string) {
  if (typeof value !== "boolean") {
    throw new Error(`Поле ${fieldName} должно быть true или false`);
  }

  return value;
}

function getAuthUserRoleField(value: unknown, fieldName: string): AuthUserRole {
  if (typeof value !== "string") {
    throw new Error(`Поле ${fieldName} должно содержать роль пользователя`);
  }

  if (value !== "admin" && value !== "dispatcher" && value !== "dispatch-chief") {
    throw new Error(`Поле ${fieldName} содержит неизвестную роль`);
  }

  return value;
}

function hasBodyField(body: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
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

function validateTabPermissionsInput(value: unknown): AuthTabPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Поле tabPermissions должно быть объектом");
  }

  for (const [tabId, access] of Object.entries(value)) {
    if (!access || typeof access !== "object" || Array.isArray(access)) {
      throw new Error(`Права вкладки ${tabId} должны быть объектом`);
    }

    const rawAccess = access as Record<string, unknown>;
    if (typeof rawAccess.view !== "boolean" || typeof rawAccess.edit !== "boolean") {
      throw new Error(`Права вкладки ${tabId} должны содержать boolean поля view и edit`);
    }
  }

  return normalizeAuthTabPermissions(value);
}

function getTabPermissions(value: unknown): AuthTabPermissions {
  return validateTabPermissionsInput(value);
}

function getOptionalAuthUserRole(body: Record<string, unknown>, key: string) {
  if (!hasBodyField(body, key)) return undefined;
  return getAuthUserRoleField(body[key], key);
}

function getOptionalBooleanField(body: Record<string, unknown>, key: string) {
  if (!hasBodyField(body, key)) return undefined;
  return getBooleanField(body[key], key);
}

function getOptionalTabPermissions(body: Record<string, unknown>, key: string) {
  if (!hasBodyField(body, key)) return undefined;
  return getTabPermissions(body[key]);
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
  try {
    const login = getString(body.login);
    const password = getString(body.password);
    const role: AuthUserRole = hasBodyField(body, "role")
      ? getAuthUserRoleField(body.role, "role")
      : normalizeAuthUserRole(body.role);
    const canManageUsers = hasBodyField(body, "canManageUsers")
      ? getBooleanField(body.canManageUsers, "canManageUsers")
      : false;

    const user = await createAuthUser({
      login,
      ...getProfilePayload(body),
      password,
      role,
      canManageUsers,
      tabPermissions: hasBodyField(body, "tabPermissions")
        ? getTabPermissions(body.tabPermissions)
        : {},
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
  let password: string | undefined;
  let role: AuthUserRole | undefined;
  let canManageUsers: boolean | undefined;
  let active: boolean | undefined;
  let tabPermissions: AuthTabPermissions | undefined;

  try {
    password = getString(body.password) || undefined;
    role = getOptionalAuthUserRole(body, "role");
    canManageUsers = getOptionalBooleanField(body, "canManageUsers");
    active = getOptionalBooleanField(body, "active");
    tabPermissions = getOptionalTabPermissions(body, "tabPermissions");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Пользователь не сохранен";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (manager && isSelfUpdate && active === false) {
    return NextResponse.json({ error: "Нельзя заблокировать свою учетную запись" }, { status: 400 });
  }
  if (manager && isSelfUpdate && canManageUsers === false) {
    return NextResponse.json({ error: "Нельзя снять у себя право управлять пользователями" }, { status: 400 });
  }

  try {
    const user = await updateAuthUser({
      id,
      ...getProfilePayload(body),
      password,
      role: manager ? role : undefined,
      canManageUsers: manager ? canManageUsers : undefined,
      active: manager ? active : undefined,
      tabPermissions: manager ? tabPermissions : undefined,
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
