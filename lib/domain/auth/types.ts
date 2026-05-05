export type AuthUserRole = "dispatch-chief" | "dispatcher" | "admin";

export type AuthTabAccess = {
  view: boolean;
  edit: boolean;
};

export type AuthTabPermissions = Record<string, AuthTabAccess>;

export type AuthUser = {
  id: string;
  login: string;
  displayName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  phone: string;
  positionTitle: string;
  role: AuthUserRole;
  canManageUsers: boolean;
  tabPermissions: AuthTabPermissions;
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

export function formatAuthDisplayName(input: {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  displayName?: string;
  login?: string;
}) {
  const fio = [input.lastName, input.firstName, input.middleName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return fio || input.displayName?.trim() || input.login?.trim() || "Пользователь";
}

export function normalizeAuthTabPermissions(value: unknown): AuthTabPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<AuthTabPermissions>((result, [key, access]) => {
    if (!access || typeof access !== "object" || Array.isArray(access)) return result;

    const rawAccess = access as Record<string, unknown>;
    result[key] = {
      view: rawAccess.view === true,
      edit: rawAccess.edit === true,
    };
    return result;
  }, {});
}

export function hasConfiguredAuthTabPermissions(user: AuthUser) {
  return Object.keys(user.tabPermissions).length > 0;
}

export function canAuthUserViewTab(user: AuthUser, tabId: string) {
  if (user.canManageUsers) return true;
  if (!hasConfiguredAuthTabPermissions(user)) return true;

  const access = user.tabPermissions[tabId];
  return Boolean(access?.view || access?.edit);
}

export function canAuthUserEditTab(user: AuthUser, tabId: string) {
  if (user.canManageUsers) return true;
  if (!hasConfiguredAuthTabPermissions(user)) return true;

  return Boolean(user.tabPermissions[tabId]?.edit);
}
