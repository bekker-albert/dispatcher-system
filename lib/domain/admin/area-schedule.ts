export type AreaShiftCutoffMap = Record<string, string>;

export const defaultAreaShiftScheduleArea = "Все участки";
export const defaultAreaShiftCutoffTime = "20:00";

const areaShiftCutoffPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const defaultAreaShiftCutoffs: AreaShiftCutoffMap = {
  [defaultAreaShiftScheduleArea]: defaultAreaShiftCutoffTime,
};

export function isValidAreaShiftCutoffTime(value: string | null | undefined): value is string {
  return typeof value === "string" && areaShiftCutoffPattern.test(value);
}

export function normalizeAreaShiftCutoffs(value: unknown): AreaShiftCutoffMap {
  const normalizedEntries = isObjectRecord(value)
    ? Object.entries(value).flatMap(([area, cutoffTime]) => {
      const normalizedArea = area.trim();
      if (!normalizedArea || !isValidAreaShiftCutoffTime(typeof cutoffTime === "string" ? cutoffTime : null)) return [];
      return [[normalizedArea, cutoffTime] as const];
    })
    : [];

  return {
    ...defaultAreaShiftCutoffs,
    ...(Object.fromEntries(normalizedEntries) as AreaShiftCutoffMap),
  };
}

export function resolveAreaShiftCutoffTime(areaShiftCutoffs: AreaShiftCutoffMap, area: string) {
  const normalizedArea = area.trim();

  if (normalizedArea && isValidAreaShiftCutoffTime(areaShiftCutoffs[normalizedArea])) {
    return areaShiftCutoffs[normalizedArea];
  }

  if (isValidAreaShiftCutoffTime(areaShiftCutoffs[defaultAreaShiftScheduleArea])) {
    return areaShiftCutoffs[defaultAreaShiftScheduleArea];
  }

  return defaultAreaShiftCutoffTime;
}

export function resolveAutomaticWorkingDate(areaShiftCutoffs: AreaShiftCutoffMap, area: string, now = new Date()) {
  const [cutoffHours, cutoffMinutes] = resolveAreaShiftCutoffTime(areaShiftCutoffs, area).split(":").map(Number);
  const nextDate = new Date(now);
  const currentMinutes = nextDate.getHours() * 60 + nextDate.getMinutes();
  const cutoffTotalMinutes = cutoffHours * 60 + cutoffMinutes;

  if (currentMinutes < cutoffTotalMinutes) {
    nextDate.setDate(nextDate.getDate() - 1);
  }

  return nextDate;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
