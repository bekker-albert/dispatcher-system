import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type DispatchStructureOptionSource = Pick<PtoPlanRow, "area" | "location" | "structure">;

export type DispatchStructureOptionIndex = {
  locationsByArea: Map<string, string[]>;
  structuresByAreaLocation: Map<string, string[]>;
};

function dispatchPtoAreaMatches(rowArea: string, areaFilter: string) {
  const normalizedArea = normalizeLookupValue(cleanAreaName(areaFilter));
  const allAreas = normalizeLookupValue("Все участки");
  if (!normalizedArea || normalizedArea === allAreas) return true;

  return normalizeLookupValue(cleanAreaName(rowArea)) === normalizedArea;
}

export function createDispatchLocationOptionsFromPtoPlan(
  rows: readonly DispatchStructureOptionSource[],
  areaFilter: string,
) {
  return uniqueSorted(rows.flatMap((row) => {
    const location = row.location.trim();
    if (!location || !dispatchPtoAreaMatches(row.area, areaFilter)) return [];

    return [location];
  }));
}

export function createDispatchStructureOptionsFromPtoPlan(
  rows: readonly DispatchStructureOptionSource[],
  areaFilter: string,
  locationFilter = "",
) {
  const normalizedLocation = normalizeLookupValue(locationFilter);

  return uniqueSorted(rows.flatMap((row) => {
    const structure = row.structure.trim();
    if (!structure) return [];

    const rowLocation = normalizeLookupValue(row.location);
    const areaOk = dispatchPtoAreaMatches(row.area, areaFilter);
    const locationOk = !normalizedLocation || rowLocation === normalizedLocation;

    return areaOk && locationOk ? [structure] : [];
  }));
}

function dispatchAreaIndexKey(area: string) {
  return normalizeLookupValue(cleanAreaName(area));
}

function dispatchIndexKey(area: string, location = "") {
  return [dispatchAreaIndexKey(area), normalizeLookupValue(location)].join("::");
}

function appendUniqueOption(target: Map<string, Set<string>>, key: string, value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return;

  const values = target.get(key) ?? new Set<string>();
  values.add(normalizedValue);
  target.set(key, values);
}

function sortIndexValues(source: Map<string, Set<string>>) {
  return new Map(Array.from(source.entries()).map(([key, values]) => [
    key,
    Array.from(values).sort((left, right) => left.localeCompare(right, "ru")),
  ]));
}

export function createDispatchStructureOptionIndex(
  rows: readonly DispatchStructureOptionSource[],
): DispatchStructureOptionIndex {
  const locationsByArea = new Map<string, Set<string>>();
  const structuresByAreaLocation = new Map<string, Set<string>>();

  rows.forEach((row) => {
    const area = row.area.trim();
    const location = row.location.trim();
    const structure = row.structure.trim();
    if (!area) return;

    const areaKey = dispatchAreaIndexKey(area);
    const areaLocationKey = dispatchIndexKey(area, location);

    appendUniqueOption(locationsByArea, areaKey, location);
    appendUniqueOption(structuresByAreaLocation, areaLocationKey, structure);
    appendUniqueOption(structuresByAreaLocation, dispatchIndexKey(area, ""), structure);
  });

  return {
    locationsByArea: sortIndexValues(locationsByArea),
    structuresByAreaLocation: sortIndexValues(structuresByAreaLocation),
  };
}

export function getDispatchLocationOptionsFromIndex(
  index: DispatchStructureOptionIndex,
  areaFilter: string,
) {
  return index.locationsByArea.get(dispatchAreaIndexKey(areaFilter)) ?? [];
}

export function getDispatchStructureOptionsFromIndex(
  index: DispatchStructureOptionIndex,
  areaFilter: string,
  locationFilter = "",
) {
  return index.structuresByAreaLocation.get(dispatchIndexKey(areaFilter, locationFilter)) ?? [];
}
