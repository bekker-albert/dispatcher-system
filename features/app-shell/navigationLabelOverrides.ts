import type { AuthUser } from "@/lib/domain/auth/types";

import type { NavigationGroup, NavigationItem } from "./navigationModel";

export const navigationLabelOverrideStorageKey = "aam.dispatch.navigationLabels.v1";
export const navigationLabelMaxLength = 48;

export type NavigationLabelOverrides = Record<string, string>;

export type NavigationLabelEditableEntry = {
  id: string;
  defaultLabel: string;
  depth: number;
  kind: "workspace" | "item";
};

function sanitizeNavigationLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, navigationLabelMaxLength);
}

function applyItemLabelOverrides(item: NavigationItem, overrides: NavigationLabelOverrides): NavigationItem {
  return {
    ...item,
    label: overrides[item.id] ?? item.label,
    children: item.children?.map((child) => applyItemLabelOverrides(child, overrides)),
  };
}

export function applyNavigationLabelOverrides(
  groups: NavigationGroup[],
  overrides: NavigationLabelOverrides,
): NavigationGroup[] {
  return groups.map((group) => ({
    ...group,
    label: overrides[group.id] ?? group.label,
    items: group.items.map((item) => applyItemLabelOverrides(item, overrides)),
  }));
}

function flattenNavigationItemLabels(item: NavigationItem, depth: number): NavigationLabelEditableEntry[] {
  return [
    {
      id: item.id,
      defaultLabel: item.label,
      depth,
      kind: "item",
    },
    ...(item.children ?? []).flatMap((child) => flattenNavigationItemLabels(child, depth + 1)),
  ];
}

export function flattenNavigationLabelEntries(groups: NavigationGroup[]): NavigationLabelEditableEntry[] {
  return groups.flatMap((group) => [
    {
      id: group.id,
      defaultLabel: group.label,
      depth: 0,
      kind: "workspace" as const,
    },
    ...group.items.flatMap((item) => flattenNavigationItemLabels(item, 1)),
  ]);
}

export function normalizeNavigationLabelOverride(
  value: string,
  defaultLabel: string,
) {
  const label = sanitizeNavigationLabel(value);
  if (!label) return null;
  return label === defaultLabel ? null : label;
}

export function parseNavigationLabelOverrides(value: string | null): NavigationLabelOverrides {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<NavigationLabelOverrides>((result, [key, label]) => {
      if (typeof label !== "string") return result;
      const normalizedLabel = sanitizeNavigationLabel(label);
      if (normalizedLabel) result[key] = normalizedLabel;
      return result;
    }, {});
  } catch {
    return {};
  }
}

export function canEditNavigationLabels(user: AuthUser) {
  return user.role === "admin" || user.role === "dispatch-chief" || user.canManageUsers;
}
