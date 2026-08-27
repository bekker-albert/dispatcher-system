export type DispatchReasonCatalogKind = "downtime" | "repair";

export type DispatchReasonCatalogItem = {
  id: string;
  name: string;
};

export type DispatchReasonCatalogGroup = {
  id: string;
  name: string;
  items: DispatchReasonCatalogItem[];
};

export type DispatchReasonCatalogs = Record<DispatchReasonCatalogKind, DispatchReasonCatalogGroup[]>;

export const emptyDispatchReasonCatalogs: DispatchReasonCatalogs = {
  downtime: [],
  repair: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeItem(value: unknown): DispatchReasonCatalogItem | null {
  if (!isRecord(value)) return null;
  const id = normalizeText(value.id);
  const name = normalizeText(value.name);
  if (!id || !name) return null;
  return { id, name };
}

function normalizeGroup(value: unknown): DispatchReasonCatalogGroup | null {
  if (!isRecord(value)) return null;
  const id = normalizeText(value.id);
  const name = normalizeText(value.name);
  if (!id || !name) return null;
  const items = Array.isArray(value.items)
    ? value.items.map(normalizeItem).filter((item): item is DispatchReasonCatalogItem => item !== null)
    : [];
  return { id, name, items };
}

function normalizeGroups(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeGroup).filter((group): group is DispatchReasonCatalogGroup => group !== null);
}

export function normalizeDispatchReasonCatalogs(value: unknown): DispatchReasonCatalogs {
  if (!isRecord(value)) return emptyDispatchReasonCatalogs;
  return {
    downtime: normalizeGroups(value.downtime),
    repair: normalizeGroups(value.repair),
  };
}

export function createDispatchReasonCatalogId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
