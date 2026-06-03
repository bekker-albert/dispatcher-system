import {
  formatAuthDisplayName,
  normalizeAuthTabPermissions,
  type AuthTabPermissions,
  type AuthUserListItem,
  type AuthUserRole,
} from "@/lib/domain/auth/types";
import { compactTopTabLabel, defaultTopTabs } from "@/lib/domain/navigation/tabs";

export type UserEditDraft = {
  login?: string;
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  phone: string;
  positionTitle: string;
  password: string;
  role: AuthUserRole;
  canManageUsers: boolean;
  active: boolean;
  tabPermissions: AuthTabPermissions;
};

export const manageableTabs = defaultTopTabs.map((tab) => ({
  id: tab.id,
  label: compactTopTabLabel(tab),
}));

export function createDefaultTabPermissions(access: "view" | "edit" = "edit"): AuthTabPermissions {
  return manageableTabs.reduce<AuthTabPermissions>((permissions, tab) => {
    if (tab.id === "admin") {
      permissions[tab.id] = { view: false, edit: false };
      return permissions;
    }

    permissions[tab.id] = {
      view: true,
      edit: access === "edit",
    };
    return permissions;
  }, {});
}

export function createEmptyDraft(): UserEditDraft {
  return {
    login: "",
    lastName: "",
    firstName: "",
    middleName: "",
    email: "",
    phone: "",
    positionTitle: "",
    password: "",
    role: "dispatcher",
    canManageUsers: false,
    active: true,
    tabPermissions: createDefaultTabPermissions("edit"),
  };
}

export function createPayload(draft: UserEditDraft) {
  return {
    login: draft.login,
    displayName: formatAuthDisplayName(draft),
    lastName: draft.lastName,
    firstName: draft.firstName,
    middleName: draft.middleName,
    email: draft.email,
    phone: draft.phone,
    positionTitle: draft.positionTitle,
    password: draft.password,
    role: draft.role,
    canManageUsers: draft.canManageUsers,
    active: draft.active,
    tabPermissions: draft.tabPermissions,
  };
}

export function createDraftFromUser(user: AuthUserListItem): UserEditDraft {
  return {
    lastName: user.lastName,
    firstName: user.firstName,
    middleName: user.middleName,
    email: user.email,
    phone: user.phone,
    positionTitle: user.positionTitle,
    login: user.login,
    password: "",
    role: user.role,
    canManageUsers: user.canManageUsers,
    active: user.active,
    tabPermissions: normalizeAuthTabPermissions(user.tabPermissions),
  };
}

export function hasUserDraftChanges(left: UserEditDraft, right: UserEditDraft) {
  return left.login !== right.login
    || left.lastName !== right.lastName
    || left.firstName !== right.firstName
    || left.middleName !== right.middleName
    || left.email !== right.email
    || left.phone !== right.phone
    || left.positionTitle !== right.positionTitle
    || left.password !== right.password
    || left.role !== right.role
    || left.canManageUsers !== right.canManageUsers
    || left.active !== right.active
    || !hasSameTabPermissions(left.tabPermissions, right.tabPermissions);
}

function hasSameTabPermissions(left: UserEditDraft["tabPermissions"], right: UserEditDraft["tabPermissions"]) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const leftAccess = left[key] ?? { view: false, edit: false };
    const rightAccess = right[key] ?? { view: false, edit: false };
    if (leftAccess.view !== rightAccess.view || leftAccess.edit !== rightAccess.edit) {
      return false;
    }
  }

  return true;
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
