export const databaseConflictCode = "DATABASE_CONFLICT";

export class DatabaseConflictError extends Error {
  code = databaseConflictCode;

  constructor(message = "Данные в базе уже изменились. Обновите страницу перед сохранением.") {
    super(message);
    this.name = "DatabaseConflictError";
  }
}

export function isDatabaseConflictResponseError(error: unknown) {
  return error instanceof DatabaseConflictError
    || (
      Boolean(error)
      && typeof error === "object"
      && (
        (error as { name?: unknown }).name === "DatabaseConflictError"
        || (error as { code?: unknown }).code === databaseConflictCode
      )
    );
}
