import type { AuthUser } from "../../domain/auth/types";

export const authSessionCookieName = "aam_dispatch_session";

export function authRequired() {
  return process.env.AUTH_REQUIRED !== "false";
}

export function getAuthSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    return process.env.DB_PASSWORD || "dispatcher-development-session-secret";
  }

  throw new Error("AUTH_SESSION_SECRET is required in production");
}

export function getInitialAuthUserConfig() {
  const login = process.env.AUTH_INITIAL_LOGIN?.trim();
  const password = process.env.AUTH_INITIAL_PASSWORD;
  const displayName = process.env.AUTH_INITIAL_DISPLAY_NAME?.trim() || login;

  if (!login || !password) return null;

  return {
    login,
    password,
    displayName: displayName || login,
  };
}

export function getAuthDisabledUser(): AuthUser {
  return {
    id: "auth_disabled",
    login: "local",
    displayName: "Локальный пользователь",
    role: "dispatch-chief",
    canManageUsers: true,
  };
}
