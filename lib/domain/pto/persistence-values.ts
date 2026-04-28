export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, Number(item)] as const)
      .filter(([, item]) => Number.isFinite(item)),
  );
}

export function asObjectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function asFiniteNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function latestPtoUpdatedAt(
  groups: Array<Array<{ updated_at?: string | null }>>,
  normalize: (value: unknown) => string | null | undefined = (value) =>
    typeof value === "string" && value.trim().length > 0 ? value : null,
) {
  return groups
    .flatMap((group) => group.map((item) => item.updated_at))
    .map(normalize)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
}
