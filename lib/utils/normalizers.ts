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

function localizeErrorText(message: string) {
  const normalized = message.trim();
  const lower = normalized.toLowerCase();

  if (!normalized) return "";
  if (lower === "failed to fetch" || lower.includes("networkerror")) {
    return "Нет соединения с сервером. Проверь интернет или доступность сайта.";
  }
  if (lower.includes("database request failed")) {
    return "Запрос к базе данных не выполнен.";
  }
  if (lower.includes("supabase is not configured")) {
    return "База данных не настроена.";
  }
  if (lower.includes("unauthorized") || lower.includes("permission denied") || lower.includes("access denied")) {
    return "Нет прав для выполнения операции.";
  }
  if (lower.includes("not found")) {
    return "Запрошенные данные не найдены.";
  }
  if (lower.includes("timeout")) {
    return "Сервер не ответил вовремя.";
  }

  return normalized;
}

export function errorToMessage(error: unknown) {
  if (error instanceof Error) return localizeErrorText(error.message || error.name);
  if (typeof error === "string") return localizeErrorText(error);
  if (typeof error === "number" || typeof error === "boolean" || typeof error === "bigint") return String(error);

  if (isRecord(error)) {
    const message = typeof error.message === "string" ? error.message : "";
    const errorText = typeof error.error === "string" ? error.error : "";
    const details = typeof error.details === "string" ? error.details : "";
    const hint = typeof error.hint === "string" ? error.hint : "";
    const code = typeof error.code === "string" || typeof error.code === "number" ? String(error.code) : "";
    const sqlMessage = typeof error.sqlMessage === "string" ? error.sqlMessage : "";
    const statusText = typeof error.statusText === "string" ? error.statusText : "";

    const readableParts = [message, errorText, sqlMessage, statusText, details, hint]
      .map((part) => part.trim())
      .filter(Boolean);
    const readable = Array.from(new Set(readableParts)).join(" ");

    if (readable && code) return `${localizeErrorText(readable)} (код: ${code})`;
    if (readable) return localizeErrorText(readable);
    if (code) return `Код ошибки: ${code}`;

    try {
      return `Сервер вернул ошибку: ${JSON.stringify(error)}`;
    } catch {
      return "Не удалось прочитать текст ошибки.";
    }
  }

  return "Неизвестная ошибка.";
}
