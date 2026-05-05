import {
  formatAuthDisplayName,
  type AuthTabPermissions,
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
    tabPermissions: {},
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
