import type { NavigationGroup, NavigationItem } from "./navigationModel";

export const navigationOrderOverrideStorageKey = "aam.dispatch.navigationOrder.v1";

export type NavigationOrderOverrides = Record<string, string[]>;

function reorderItems<T extends { id: string }>(items: T[], orderedIds: string[] | undefined) {
  if (!orderedIds?.length) return items;

  const itemById = new Map(items.map((item) => [item.id, item]));
  const orderedItems = orderedIds.flatMap((id) => {
    const item = itemById.get(id);
    return item ? [item] : [];
  });
  const remainingItems = items.filter((item) => !orderedIds.includes(item.id));

  return [...orderedItems, ...remainingItems];
}

function applyItemOrderOverrides(item: NavigationItem, overrides: NavigationOrderOverrides): NavigationItem {
  const orderedChildren = reorderItems(item.children ?? [], overrides[item.id]);

  return {
    ...item,
    children: orderedChildren.map((child) => applyItemOrderOverrides(child, overrides)),
  };
}

export function applyNavigationOrderOverrides(
  groups: NavigationGroup[],
  overrides: NavigationOrderOverrides,
): NavigationGroup[] {
  return groups.map((group) => ({
    ...group,
    items: reorderItems(group.items, overrides[group.id]).map((item) => applyItemOrderOverrides(item, overrides)),
  }));
}

function collectItemOrderParents(item: NavigationItem): Record<string, string[]> {
  const childOrder = item.children?.map((child) => child.id) ?? [];
  const nested = item.children?.reduce<Record<string, string[]>>((result, child) => ({
    ...result,
    ...collectItemOrderParents(child),
  }), {}) ?? {};

  return childOrder.length > 0 ? { [item.id]: childOrder, ...nested } : nested;
}

export function createNavigationDefaultOrder(groups: NavigationGroup[]) {
  return groups.reduce<Record<string, string[]>>((result, group) => ({
    ...result,
    [group.id]: group.items.map((item) => item.id),
    ...group.items.reduce<Record<string, string[]>>((itemResult, item) => ({
      ...itemResult,
      ...collectItemOrderParents(item),
    }), {}),
  }), {});
}

export function moveNavigationItemWithinParent(
  ids: string[],
  draggedId: string,
  targetId: string,
) {
  if (draggedId === targetId) return ids;
  if (!ids.includes(draggedId) || !ids.includes(targetId)) return ids;

  const next = ids.filter((id) => id !== draggedId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex, 0, draggedId);
  return next;
}

export function parseNavigationOrderOverrides(value: string | null): NavigationOrderOverrides {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<NavigationOrderOverrides>((result, [parentId, orderedIds]) => {
      if (!Array.isArray(orderedIds)) return result;

      const ids = orderedIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
      if (ids.length > 0) result[parentId] = ids;
      return result;
    }, {});
  } catch {
    return {};
  }
}
