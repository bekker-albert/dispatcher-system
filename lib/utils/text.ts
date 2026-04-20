export function normalizeLookupValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^уч[._\s-]*/, "")
    .replace(/[^a-zа-яё0-9]+/g, "");
}

export function cleanAreaName(value: string) {
  return value.replace(/^Уч[._\s-]*/i, "").replace(/^уч[._\s-]*/i, "");
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "ru"));
}
