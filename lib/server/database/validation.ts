export class DatabasePayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabasePayloadError";
  }
}

export function isDatabasePayloadError(error: unknown) {
  return error instanceof DatabasePayloadError
    || (
      Boolean(error)
      && typeof error === "object"
      && (error as { name?: unknown }).name === "DatabasePayloadError"
    );
}

export function requirePayloadString(value: unknown, fieldName: string) {
  if (typeof value === "string" && value.trim().length > 0) return value;
  throw new DatabasePayloadError(`Некорректный запрос: поле "${fieldName}" обязательно.`);
}

export function requirePayloadNumber(value: unknown, fieldName: string) {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(numberValue)) return numberValue;
  throw new DatabasePayloadError(`Некорректный запрос: поле "${fieldName}" должно быть числом.`);
}

export function optionalPayloadNumberOrNull(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") return null;
  return requirePayloadNumber(value, fieldName);
}

export function requirePayloadArray<T = unknown>(value: unknown, fieldName: string): T[] {
  if (Array.isArray(value)) return value as T[];
  throw new DatabasePayloadError(`Некорректный запрос: поле "${fieldName}" должно быть списком.`);
}

export function requirePayloadRecord<T extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown,
  fieldName: string,
) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  throw new DatabasePayloadError(`Некорректный запрос: поле "${fieldName}" должно быть объектом.`);
}
