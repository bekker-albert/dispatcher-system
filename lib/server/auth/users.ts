import type { RowDataPacket } from "mysql2/promise";
import { randomBytes } from "node:crypto";

import type { AuthUser, AuthUserListItem, AuthUserRole } from "../../domain/auth/types";
import { normalizeAuthUserRole } from "../../domain/auth/types";
import { getInitialAuthBootstrapUser, getInitialAuthUserConfig, initialAuthUserId } from "./config";
import { hashPassword, verifyPassword, verifyPlainPassword } from "./password";
import { authExecute, authRows } from "./schema";

type AuthUserRecord = RowDataPacket & {
  user_id: string;
  login: string;
  display_name: string;
  role: string;
  can_manage_users: 0 | 1;
  active: 0 | 1;
  password_hash: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type CreateAuthUserInput = {
  login: string;
  displayName: string;
  password: string;
  role: AuthUserRole;
  canManageUsers: boolean;
};

function createUserId() {
  return `usr_${randomBytes(12).toString("hex")}`;
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function toAuthUser(record: AuthUserRecord): AuthUser {
  return {
    id: record.user_id,
    login: record.login,
    displayName: record.display_name,
    role: normalizeAuthUserRole(record.role),
    canManageUsers: Boolean(record.can_manage_users),
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

async function loadAuthUserRecordByLogin(login: string) {
  const rows = await authRows<AuthUserRecord>(
    `SELECT user_id, login, display_name, role, can_manage_users, active, password_hash, created_at, updated_at
    FROM auth_users
    WHERE login = ?
    LIMIT 1`,
    [normalizeLogin(login)],
  );

  return rows[0] ?? null;
}

async function loadAuthUserRecordById(userId: string) {
  const rows = await authRows<AuthUserRecord>(
    `SELECT user_id, login, display_name, role, can_manage_users, active, password_hash, created_at, updated_at
    FROM auth_users
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

  await createAuthUser({
    login: initialUser.login,
    displayName: initialUser.displayName,
    password: initialUser.password,
    role: "dispatch-chief",
    canManageUsers: true,
  });
}

export async function authenticateAuthUser(login: string, password: string) {
  const initialUser = getInitialAuthUserConfig();
  if (
    initialUser
    && normalizeLogin(login) === normalizeLogin(initialUser.login)
    && verifyPlainPassword(password, initialUser.password)
  ) {
    return getInitialAuthBootstrapUser();
  }

  await ensureInitialAuthUser();
  const record = await loadAuthUserRecordByLogin(login);
  if (!record || !record.active) return null;

  const valid = await verifyPassword(password, record.password_hash);
  if (!valid) return null;

  return toAuthUser(record);
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
    `SELECT user_id, login, display_name, role, can_manage_users, active, password_hash, created_at, updated_at
    FROM auth_users
    ORDER BY created_at ASC, login ASC`,
  );

  return rows.map(toAuthUserListItem);
}

export async function createAuthUser(input: CreateAuthUserInput) {
  const login = normalizeLogin(input.login);
  if (!login) throw new Error("Логин обязателен");
  if (input.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  if (!input.displayName.trim()) throw new Error("Имя пользователя обязательно");

  const userId = createUserId();
  const passwordHash = await hashPassword(input.password);
  await authExecute(
    `INSERT INTO auth_users
      (user_id, login, display_name, role, can_manage_users, active, password_hash)
    VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [
      userId,
      login,
      input.displayName.trim(),
      input.role,
      input.canManageUsers ? 1 : 0,
      passwordHash,
    ],
  );

  const record = await loadAuthUserRecordById(userId);
  if (!record) throw new Error("Пользователь не создан");

  return toAuthUserListItem(record);
}
