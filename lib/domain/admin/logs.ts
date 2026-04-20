import { createId } from "../../utils/id";
import { isRecord } from "../../utils/normalizers";

export const adminLogLimit = 200;

export type AdminLogAction = string;

export type AdminLogEntry = {
  id: string;
  at: string;
  user: string;
  section: string;
  action: AdminLogAction;
  details: string;
  fileName?: string;
  rowsCount?: number;
};

export function normalizeAdminLogEntry(value: unknown): AdminLogEntry | null {
  if (!isRecord(value)) return null;

  const action = typeof value.action === "string" ? value.action as AdminLogAction : "Редактирование";
  if (!action || action === "bad") return null;

  return {
    id: typeof value.id === "string" && value.id ? value.id : createId(),
    at: typeof value.at === "string" && value.at ? value.at : new Date().toISOString(),
    user: typeof value.user === "string" && value.user ? value.user : "Пользователь",
    section: typeof value.section === "string" && value.section ? value.section : "Система",
    action,
    details: typeof value.details === "string" && value.details ? value.details : "Действие без описания",
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
    rowsCount: typeof value.rowsCount === "number" && Number.isFinite(value.rowsCount) ? value.rowsCount : undefined,
  };
}

export function formatAdminLogDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}
