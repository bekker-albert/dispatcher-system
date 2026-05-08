import type { AdminSection } from "../../../lib/domain/admin/navigation";
import { defaultAreaShiftScheduleArea, type AreaShiftCutoffMap } from "../../../lib/domain/admin/area-schedule";
import { defaultReportDate } from "../../../lib/domain/pto/defaults";
import type { TopTab } from "../../../lib/domain/navigation/tabs";
import { cleanAreaName } from "../../../lib/utils/text";

export const reportDateOverrideStorageKey = "dispatcher:report-date-override";
export const reportDateOverrideAutomaticStorageKey = "dispatcher:report-date-override-automatic";

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isStoredReportDateValue(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeReportDateArea(area: string) {
  const normalizedArea = cleanAreaName(area);
  return normalizedArea || defaultAreaShiftScheduleArea;
}

export function resolveReportDateAreaContext(
  topTab: TopTab,
  adminSection: AdminSection,
  reportArea: string,
  ptoAreaFilter: string,
) {
  if (topTab === "reports" || (topTab === "admin" && adminSection === "reports")) {
    return normalizeReportDateArea(reportArea);
  }

  if (topTab === "pto") {
    return normalizeReportDateArea(ptoAreaFilter);
  }

  return defaultAreaShiftScheduleArea;
}

function previousCalendarDate(now = new Date()) {
  const previousDate = new Date(now);
  previousDate.setDate(previousDate.getDate() - 1);
  return previousDate;
}

function getClientStorage(storageName: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return null;

  try {
    return window[storageName];
  } catch {
    return null;
  }
}

function clearLegacyReportDateOverride() {
  const localStorage = getClientStorage("localStorage");
  localStorage?.removeItem(reportDateOverrideStorageKey);
}

export function clearClientReportDateOverride() {
  const sessionStorage = getClientStorage("sessionStorage");
  sessionStorage?.removeItem(reportDateOverrideStorageKey);
  sessionStorage?.removeItem(reportDateOverrideAutomaticStorageKey);
  clearLegacyReportDateOverride();
}

export function automaticReportDate(_areaShiftCutoffs: AreaShiftCutoffMap, _area: string, now = new Date()) {
  return formatDateInputValue(previousCalendarDate(now));
}

export function readClientReportDateSelection(areaShiftCutoffs: AreaShiftCutoffMap, area: string, now = new Date()) {
  if (typeof window === "undefined") return defaultReportDate;

  clearLegacyReportDateOverride();

  const nextAutomaticReportDate = automaticReportDate(areaShiftCutoffs, area, now);
  const sessionStorage = getClientStorage("sessionStorage");
  const storedOverride = sessionStorage?.getItem(reportDateOverrideStorageKey) ?? null;
  const storedAutomaticReportDate = sessionStorage?.getItem(reportDateOverrideAutomaticStorageKey) ?? null;

  if (isStoredReportDateValue(storedOverride) && storedAutomaticReportDate === nextAutomaticReportDate) {
    return storedOverride;
  }

  clearClientReportDateOverride();
  return nextAutomaticReportDate;
}

export function hasClientReportDateOverride(areaShiftCutoffs?: AreaShiftCutoffMap, area?: string, now = new Date()) {
  if (typeof window === "undefined") return false;

  const sessionStorage = getClientStorage("sessionStorage");
  const storedOverride = sessionStorage?.getItem(reportDateOverrideStorageKey) ?? null;
  if (!isStoredReportDateValue(storedOverride)) return false;

  if (!areaShiftCutoffs || !area) return true;

  const nextAutomaticReportDate = automaticReportDate(areaShiftCutoffs, area, now);
  const storedAutomaticReportDate = sessionStorage?.getItem(reportDateOverrideAutomaticStorageKey) ?? null;
  if (storedAutomaticReportDate === nextAutomaticReportDate) return true;

  clearClientReportDateOverride();
  return false;
}

export function writeClientReportDateOverride(value: string, areaShiftCutoffs: AreaShiftCutoffMap, area: string, now = new Date()) {
  if (!isStoredReportDateValue(value)) return;

  const sessionStorage = getClientStorage("sessionStorage");
  sessionStorage?.setItem(reportDateOverrideStorageKey, value);
  sessionStorage?.setItem(reportDateOverrideAutomaticStorageKey, automaticReportDate(areaShiftCutoffs, area, now));
}
