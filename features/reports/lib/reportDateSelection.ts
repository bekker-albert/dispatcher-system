import type { AdminSection } from "../../../lib/domain/admin/navigation";
import {
  defaultAreaShiftScheduleArea,
  resolveAutomaticWorkingDate,
  type AreaShiftCutoffMap,
} from "../../../lib/domain/admin/area-schedule";
import { defaultReportDate } from "../../../lib/domain/pto/defaults";
import type { TopTab } from "../../../lib/domain/navigation/tabs";
import { cleanAreaName } from "../../../lib/utils/text";

export const reportDateOverrideStorageKey = "dispatcher:report-date-override";

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

export function automaticReportDate(areaShiftCutoffs: AreaShiftCutoffMap, area: string, now = new Date()) {
  return formatDateInputValue(resolveAutomaticWorkingDate(areaShiftCutoffs, area, now));
}

export function readClientReportDateSelection(areaShiftCutoffs: AreaShiftCutoffMap, area: string) {
  if (typeof window === "undefined") return defaultReportDate;

  const storedOverride = window.localStorage.getItem(reportDateOverrideStorageKey);
  return isStoredReportDateValue(storedOverride)
    ? storedOverride
    : automaticReportDate(areaShiftCutoffs, area);
}

export function hasClientReportDateOverride() {
  if (typeof window === "undefined") return false;

  return isStoredReportDateValue(window.localStorage.getItem(reportDateOverrideStorageKey));
}
