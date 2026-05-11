import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type DispatchStructureOptionSource = Pick<PtoPlanRow, "area" | "location" | "structure">;

export function createDispatchStructureOptionsFromPtoPlan(
  rows: readonly DispatchStructureOptionSource[],
  areaFilter: string,
  locationFilter = "",
) {
  const normalizedArea = normalizeLookupValue(cleanAreaName(areaFilter));
  const normalizedLocation = normalizeLookupValue(locationFilter);
  const allAreas = normalizeLookupValue("Все участки");

  return uniqueSorted(rows.flatMap((row) => {
    const structure = row.structure.trim();
    if (!structure) return [];

    const rowArea = normalizeLookupValue(cleanAreaName(row.area));
    const rowLocation = normalizeLookupValue(row.location);
    const areaOk = normalizedArea === allAreas || !normalizedArea || rowArea === normalizedArea;
    const locationOk = !normalizedLocation || !rowLocation || rowLocation === normalizedLocation;

    return areaOk && locationOk ? [structure] : [];
  }));
}
