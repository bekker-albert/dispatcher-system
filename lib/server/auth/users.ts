import type { RowDataPacket } from "mysql2/promise";
import { randomBytes } from "node:crypto";

import type { AuthTabPermissions, AuthUser, AuthUserListItem, AuthUserRole } from "../../domain/auth/types";
import { formatAuthDisplayName, normalizeAuthTabPermissions, normalizeAuthUserRole } from "../../domain/auth/types";
import { getInitialAuthBootstrapUser, getInitialAuthUserConfig, initialAuthUserId } from "./config";
import { hashPassword, verifyPassword, verifyPlainPassword } from "./password";
import { authExecute, authRows } from "./schema";

type AuthUserRecord = RowDataPacket & {
  user_id: string;
  login: string;
  display_name: string;
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position_title?: string | null;
  role: string;
  can_manage_users: 0 | 1;
  active: 0 | 1;
  tab_permissions?: string | null;
  password_hash: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type AuthProfileInput = {
  displayName?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  positionTitle?: string;
  tabPermissions?: AuthTabPermissions;
};

type CreateAuthUserInput = AuthProfileInput & {
  login: string;
  password: string;
  role: AuthUserRole;
  canManageUsers: boolean;
};

type UpdateAuthUserInput = AuthProfileInput & {
  id: string;
  password?: string;
  role?: AuthUserRole;
  canManageUsers?: boolean;
  active?: boolean;
};

function createUserId() {
  return `usr_${randomBytes(12).toString("hex")}`;
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function normalizeText(value: string | undefined | null) {
  return typeof value === "string" ? value.trim() : "";
}

function splitDisplayName(displayName: string | undefined) {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    lastName: parts[0] ?? "",
    firstName: parts[1] ?? parts[0] ?? "",
    middleName: parts.slice(2).join(" "),
  };
}

function normalizeProfileInput(input: AuthProfileInput, fallback?: AuthUserRecord) {
  const splitFallback = splitDisplayName(fallback?.display_name ?? input.displayName);
  const lastName = normalizeText(input.lastName ?? fallback?.last_name ?? splitFallback.lastName);
  const firstName = normalizeText(input.firstName ?? fallback?.first_name ?? splitFallback.firstName);
  const middleName = normalizeText(input.middleName ?? fallback?.middle_name ?? splitFallback.middleName);
  const displayName = formatAuthDisplayName({
    lastName,
    firstName,
    middleName,
    displayName: input.displayName ?? fallback?.display_name,
    login: fallback?.login,
  });

  return {
    displayName,
    lastName,
    firstName,
    middleName,
    email: normalizeText(input.email ?? fallback?.email),
    phone: normalizeText(input.phone ?? fallback?.phone),
    positionTitle: normalizeText(input.positionTitle ?? fallback?.position_title),
    tabPermissions: input.tabPermissions ?? parseTabPermissions(fallback?.tab_permissions),
  };
}

function parseTabPermissions(value: string | null | undefined): AuthTabPermissions {
  if (!value) return {};

  try {
    return normalizeAuthTabPermissions(JSON.parse(value));
  } catch {
    return {};
  }
}

function serializeTabPermissions(value: AuthTabPermissions | undefined) {
  const normalized = normalizeAuthTabPermissions(value);
  return Object.keys(normalized).length > 0 ? JSON.stringify(normalized) : null;
}

function toAuthUser(record: AuthUserRecord): AuthUser {
  const profile = normalizeProfileInput({}, record);

  return {
    id: record.user_id,
    login: record.login,
    displayName: profile.displayName,
    lastName: profile.lastName,
    firstName: profile.firstName,
    middleName: profile.middleName,
    email: profile.email,
    phone: profile.phone,
    positionTitle: profile.positionTitle,
    role: normalizeAuthUserRole(record.role),
    canManageUsers: Boolean(record.can_manage_users),
    tabPermissions: profile.tabPermissions,
  };
}

function toAuthUserListItem(record: AuthUserRecord): AuthUserListItem {
  return {
    ...toAuthUser(record),
    active: Boolean(record.active),
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
  };
}

const authUserSelect = `
  SELECT
    user_id,
    login,
    display_name,
    last_name,
    first_name,
    middle_name,
    email,
    phone,
    position_title,
    role,
    can_manage_users,
    active,
    tab_permissions,
    password_hash,
    created_at,
    updated_at
  FROM auth_users
`;

async function loadAuthUserRecordByLogin(login: string) {
  const rows = await authRows<AuthUserRecord>(
    `${authUserSelect}
    WHERE login = ?
    LIMIT 1`,
    [normalizeLogin(login)],
  );

  return rows[0] ?? null;
}

async function loadAuthUserRecordById(userId: string) {
  const rows = await authRows<AuthUserRecord>(
    `${authUserSelect}
    WHERE user_id = ?
    LIMIT 1`,
    [userId],
  );

  return rows[0] ?? null;
}

export async function ensureInitialAuthUser() {
  const initialUser = getInitialAuthUserConfig();
  if (!initialUser) return;

  const existing = await loadAuthUserRecordByLogin(initialUser.login);
  if (existing) return;

  const nameParts = splitDisplayName(initialUser.displayName);
  await createAuthUser({
    login: initialUser.login,
    displayName: initialUser.displayName,
    ...nameParts,
    password: initialUser.password,
    role: "dispatch-chief",
    canManageUsers: true,
    tabPermissions: {},
  });
}

export async function authenticateAuthUser(login: string, password: string) {
  await ensureInitialAuthUser();

  const record = await loadAuthUserRecordByLogin(login);
  if (record?.active) {
    const valid = await verifyPassword(password, record.password_hash);
    return valid ? toAuthUser(record) : null;
  }

  const initialUser = getInitialAuthUserConfig();
  if (
    initialUser
    && normalizeLogin(login) === normalizeLogin(initialUser.login)
    && verifyPlainPassword(password, initialUser.password)
  ) {
    return getInitialAuthBootstrapUser();
  }

  return null;
}

export async function getAuthUserById(userId: string) {
  if (userId === initialAuthUserId) {
    return getInitialAuthBootstrapUser();
  }

  await ensureInitialAuthUser();
  const record = await loadAuthUserRecordById(userId);
  if (!record || !record.active) return null;

  return toAuthUser(record);
}

export async function listAuthUsers() {
  await ensureInitialAuthUser();
  const rows = await authRows<AuthUserRecord>(
    `${authUserSelect}
    ORDER BY created_at ASC, login ASC`,
  );

  return rows.map(toAuthUserListItem);
}

export async function createAuthUser(input: CreateAuthUserInput) {
  const login = normalizeLogin(input.login);
  if (!login) throw new Error("Логин обязателен");
  if (input.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");

  const profile = normalizeProfileInput(input);
  if (!profile.lastName) throw new Error("Фамилия обязательна");
  if (!profile.firstName) throw new Error("Имя обязательно");

  const userId = createUserId();
  const passwordHash = await hashPassword(input.password);
  await authExecute(
    `INSERT INTO auth_users
      (
        user_id,
        login,
        display_name,
        last_name,
        first_name,
        middle_name,
        email,
        phone,
        position_title,
        role,
        can_manage_users,
        active,
        tab_permissions,
        password_hash
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      userId,
      login,
      profile.displayName,
      profile.lastName,
      profile.firstName,
      profile.middleName,
      profile.email,
      profile.phone,
      profile.positionTitle,
      input.role,
      input.canManageUsers ? 1 : 0,
      serializeTabPermissions(profile.tabPermissions),
      passwordHash,
    ],
  );

  const record = await loadAuthUserRecordById(userId);
  if (!record) throw new Error("Пользователь не создан");

  return toAuthUserListItem(record);
}

export async function updateAuthUser(input: UpdateAuthUserInput) {
  if (!input.id.trim()) throw new Error("Пользователь не выбран");
  if (input.password !== undefined && input.password.length > 0 && input.password.length < 8) {
    throw new Error("Пароль должен быть не короче 8 символов");
  }

  const existing = await loadAuthUserRecordById(input.id);
  if (!existing) throw new Error("Пользователь не найден");

  const profile = normalizeProfileInput(input, existing);
  if (!profile.lastName) throw new Error("Фамилия обязательна");
  if (!profile.firstName) throw new Error("Имя обязательно");

  const role = input.role ?? normalizeAuthUserRole(existing.role);
  const canManageUsers = input.canManageUsers ?? Boolean(existing.can_manage_users);
  const active = input.active ?? Boolean(existing.active);

  const values: unknown[] = [
    profile.displayName,
    profile.lastName,
    profile.firstName,
    profile.middleName,
    profile.email,
    profile.phone,
    profile.positionTitle,
    role,
    canManageUsers ? 1 : 0,
    active ? 1 : 0,
    serializeTabPermissions(profile.tabPermissions),
  ];

  let passwordSql = "";
  if (input.password && input.password.length > 0) {
    const passwordHash = await hashPassword(input.password);
    passwordSql = ", password_hash = ?";
    values.push(passwordHash);
  }

  values.push(input.id);

  await authExecute(
    `UPDATE auth_users
      SET
        display_name = ?,
        last_name = ?,
        first_name = ?,
        middle_name = ?,
        email = ?,
        phone = ?,
        position_title = ?,
        role = ?,
        can_manage_users = ?,
        active = ?,
        tab_permissions = ?
        ${passwordSql}
      WHERE user_id = ?`,
    values,
  );

  const record = await loadAuthUserRecordById(input.id);
  if (!record) throw new Error("Пользователь не найден");

  return toAuthUserListItem(record);
}

export async function deleteAuthUser(userId: string, actorUserId: string | undefined) {
  const id = userId.trim();
  if (!id) throw new Error("Пользователь не выбран");
  if (id === initialAuthUserId) throw new Error("Системного пользователя удалить нельзя");
  if (actorUserId && id === actorUserId) throw new Error("Нельзя удалить свою учетную запись");

  const existing = await loadAuthUserRecordById(id);
  if (!existing) throw new Error("Пользователь не найден");

  await authExecute("DELETE FROM auth_users WHERE user_id = ?", [id]);
}
