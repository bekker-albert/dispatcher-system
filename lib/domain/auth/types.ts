export type AuthUserRole = "dispatch-chief" | "dispatcher" | "admin";

export type AuthUser = {
  id: string;
  login: string;
  displayName: string;
  role: AuthUserRole;
  canManageUsers: boolean;
};

export type AuthUserListItem = AuthUser & {
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: string;
};

export const authRoleLabels: Record<AuthUserRole, string> = {
  admin: "Администратор",
  dispatcher: "Диспетчер",
  "dispatch-chief": "Начальник диспетчерской службы",
};

export function normalizeAuthUserRole(value: unknown): AuthUserRole {
  return value === "admin" || value === "dispatcher" || value === "dispatch-chief"
    ? value
    : "dispatcher";
}
