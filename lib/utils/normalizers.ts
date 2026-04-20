import { normalizeLookupValue } from "./text";

export function mergeDefaultsById<T extends { id: string }>(items: T[], defaults: T[]) {
  const existingIds = new Set(items.map((item) => item.id));
  return [...items, ...defaults.filter((item) => !existingIds.has(item.id))];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeNumberRecord(value: unknown, minValue: number, maxValue: number) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, Number(item)] as const)
      .filter(([key, item]) => key.trim() && Number.isFinite(item))
      .map(([key, item]) => [key, Math.min(maxValue, Math.max(minValue, Math.round(item)))]),
  ) as Record<string, number>;
}

export function normalizeDecimalRecord(value: unknown, minValue: number, maxValue: number, fractionDigits = 2) {
  if (!isRecord(value)) return {};

  const multiplier = 10 ** fractionDigits;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, Number(item)] as const)
      .filter(([key, item]) => key.trim() && Number.isFinite(item))
      .map(([key, item]) => [key, Math.min(maxValue, Math.max(minValue, Math.round(item * multiplier) / multiplier))]),
  ) as Record<string, number>;
}

export function normalizeStringRecord(value: unknown) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => entry[0].trim() !== "" && typeof entry[1] === "string")
      .map(([key, item]) => [key, item.trim()])
      .filter(([, item]) => item !== ""),
  ) as Record<string, string>;
}

export function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean),
  ));
}

export function normalizeStringListRecord(value: unknown) {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [normalizeLookupValue(key), normalizeStringList(item)] as const)
      .filter(([key, items]) => key !== "" && items.length > 0),
  ) as Record<string, string[]>;
}

export function errorToMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
