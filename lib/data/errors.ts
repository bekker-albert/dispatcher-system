import { isRecord } from "../utils/normalizers";

function stringErrorParts(parts: unknown[]) {
  return parts
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map(String);
}

function errorMessageParts(error: unknown): string[] {
  if (error instanceof Error) {
    return stringErrorParts([
      error.message,
      error.name,
      (error as { code?: unknown }).code,
      (error as { status?: unknown }).status,
      (error as { statusText?: unknown }).statusText,
      (error as { details?: unknown }).details,
      (error as { hint?: unknown }).hint,
    ]);
  }
  if (typeof error === "string") return [error];

  if (isRecord(error)) {
    return stringErrorParts([
      error.message,
      error.error,
      error.details,
      error.hint,
      error.code,
      error.status,
      error.statusText,
    ]);
  }

  return [];
}

export function isDatabaseConflictError(error: unknown) {
  const message = errorMessageParts(error).join(" ").toLowerCase();

  return message.includes("changed in another tab")
    || message.includes("changed in database")
    || message.includes("reload before saving")
    || message.includes("conflict")
    || message.includes("database_conflict")
    || message.includes("данные пто уже изменились")
    || message.includes("данные пто в базе уже изменились")
    || message.includes("данные пто изменились другим пользователем")
    || message.includes("данные приложения уже изменились")
    || message.includes("настройки уже изменились")
    || message.includes("список техники уже изменился")
    || message.includes("обновите страницу перед")
    || message.includes("409");
}
