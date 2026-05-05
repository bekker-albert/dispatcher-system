import type { AuthUser } from "../../domain/auth/types";
import { formatAuthDisplayName } from "../../domain/auth/types";

export const authSessionCookieName = "aam_dispatch_session";
export const initialAuthUserId = "initial-auth-user";

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

function splitDisplayName(displayName: string | undefined) {
  const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    lastName: parts[0] ?? "",
    firstName: parts[1] ?? parts[0] ?? "",
    middleName: parts.slice(2).join(" "),
  };
}

export function getInitialAuthBootstrapUser(): AuthUser | null {
  const initialUser = getInitialAuthUserConfig();
  if (!initialUser) return null;

  const nameParts = splitDisplayName(initialUser.displayName);
  return {
    id: initialAuthUserId,
    login: initialUser.login.trim().toLowerCase(),
    displayName: formatAuthDisplayName({ ...nameParts, displayName: initialUser.displayName, login: initialUser.login }),
    ...nameParts,
    email: "",
    phone: "",
    positionTitle: "",
    role: "dispatch-chief",
    canManageUsers: true,
    tabPermissions: {},
  };
}

export function getAuthDisabledUser(): AuthUser {
  return {
    id: "auth_disabled",
    login: "local",
    displayName: "Локальный пользователь",
    lastName: "",
    firstName: "Локальный",
    middleName: "",
    email: "",
    phone: "",
    positionTitle: "",
    role: "dispatch-chief",
    canManageUsers: true,
    tabPermissions: {},
  };
}
