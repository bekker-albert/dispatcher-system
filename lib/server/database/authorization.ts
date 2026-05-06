import {
  canAuthUserEditTab,
  canAuthUserViewTab,
  type AuthUser,
} from "../../domain/auth/types";
import type { BaseTopTab } from "../../domain/navigation/tabs";
import { adminStorageKeys } from "../../storage/keys";
import { isDatabaseStatusRequest } from "./status";

type DatabaseAccessLevel = "authenticated" | "view" | "edit";

type DatabaseAccessRequirement = {
  level: DatabaseAccessLevel;
  tabIds?: BaseTopTab[];
};

type DatabaseAuthorizationRequest = {
  resource?: string;
  action?: string;
  payload?: unknown;
};

export type DatabaseAuthorizationResult = {
  allowed: boolean;
  requirement: DatabaseAccessRequirement;
};

const databaseWriteActionPrefixes = ["save", "delete", "update", "set", "clear", "replace"] as const;

const settingsKeyTabMap: Record<string, BaseTopTab> = {
  [adminStorageKeys.reportCustomers]: "reports",
  [adminStorageKeys.reportAreaOrder]: "reports",
  [adminStorageKeys.reportWorkOrder]: "reports",
  [adminStorageKeys.reportHeaderLabels]: "reports",
  [adminStorageKeys.reportColumnWidths]: "reports",
  [adminStorageKeys.reportReasons]: "reports",
  [adminStorageKeys.dispatchSummaryRows]: "dispatch",
  [adminStorageKeys.areaShiftCutoffs]: "dispatch",
  [adminStorageKeys.customTabs]: "admin",
  [adminStorageKeys.topTabs]: "admin",
  [adminStorageKeys.subTabs]: "admin",
  [adminStorageKeys.orgMembers]: "admin",
  [adminStorageKeys.dependencyNodes]: "admin",
  [adminStorageKeys.dependencyLinks]: "admin",
  [adminStorageKeys.adminLogs]: "admin",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueTabIds(tabIds: BaseTopTab[]) {
  return Array.from(new Set(tabIds));
}

function getPayloadRecord(payload: unknown) {
  return isRecord(payload) ? payload : {};
}

function settingKeysFromRecord(value: unknown) {
  return isRecord(value) ? Object.keys(value) : [];
}

function settingKeysFromStorageRecord(value: unknown) {
  return isRecord(value) ? Object.keys(value).filter((key) => key in settingsKeyTabMap) : [];
}

function settingEditTabs(keys: string[]) {
  const tabs = keys.map((key) => settingsKeyTabMap[key] ?? "admin");
  return uniqueTabIds(tabs.length > 0 ? tabs : ["admin"]);
}

function isWriteAction(action?: string) {
  const normalizedAction = action?.trim().toLowerCase() ?? "";
  return databaseWriteActionPrefixes.some((prefix) => normalizedAction.startsWith(prefix));
}

function tabRequirement(tabId: BaseTopTab, action?: string): DatabaseAccessRequirement {
  return {
    level: isWriteAction(action) ? "edit" : "view",
    tabIds: [tabId],
  };
}

export function getDatabaseAccessRequirement({
  resource,
  action,
  payload,
}: DatabaseAuthorizationRequest): DatabaseAccessRequirement {
  if (isDatabaseStatusRequest(resource, action)) {
    return { level: "authenticated" };
  }

  if (resource === "pto") {
    return tabRequirement("pto", action);
  }

  if (resource === "vehicles") {
    return tabRequirement("fleet", action);
  }

  if (resource === "settings") {
    if (action === "load") return { level: "authenticated" };
    if (action === "save") {
      const record = getPayloadRecord(payload);
      return { level: "edit", tabIds: settingEditTabs(settingKeysFromRecord(record.settings)) };
    }
  }

  if (resource === "app-state") {
    if (action === "load" || action === "load-bootstrap") return { level: "authenticated" };
    if (action === "save") {
      const record = getPayloadRecord(payload);
      return { level: "edit", tabIds: settingEditTabs(settingKeysFromStorageRecord(record.storage)) };
    }
    if (action === "save-client-snapshot" || action === "load-client-snapshots") {
      return { level: "edit", tabIds: ["admin"] };
    }
  }

  return { level: "authenticated" };
}

export function authorizeDatabaseRequest(
  user: AuthUser,
  request: DatabaseAuthorizationRequest,
): DatabaseAuthorizationResult {
  const requirement = getDatabaseAccessRequirement(request);
  const tabIds = requirement.tabIds ?? [];

  if (requirement.level === "authenticated" || tabIds.length === 0) {
    return { allowed: true, requirement };
  }

  const allowed = tabIds.every((tabId) => (
    requirement.level === "edit"
      ? canAuthUserEditTab(user, tabId)
      : canAuthUserViewTab(user, tabId)
  ));

  return { allowed, requirement };
}
