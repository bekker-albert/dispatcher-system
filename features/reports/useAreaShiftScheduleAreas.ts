import { useMemo } from "react";

import { defaultAreaShiftScheduleArea, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import { sortAreaNamesByOrder } from "@/lib/domain/reports/display";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { ReportRow } from "@/lib/domain/reports/types";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type UseAreaShiftScheduleAreasOptions = {
  active: boolean;
  areaShiftCutoffs: AreaShiftCutoffMap;
  reportBaseRows: ReportRow[];
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  vehicleRows: VehicleRow[];
  reportAreaOrder: string[];
};

export function useAreaShiftScheduleAreas({
  active,
  areaShiftCutoffs,
  reportBaseRows,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  vehicleRows,
  reportAreaOrder,
}: UseAreaShiftScheduleAreasOptions) {
  return useMemo(() => {
    if (!active) return [defaultAreaShiftScheduleArea];

    const allAreas = uniqueSorted([
      defaultAreaShiftScheduleArea,
      ...Object.keys(areaShiftCutoffs),
      ...reportBaseRows.map((row) => cleanAreaName(row.area)),
      ...ptoPlanRows.map((row) => cleanAreaName(row.area)),
      ...ptoOperRows.map((row) => cleanAreaName(row.area)),
      ...ptoSurveyRows.map((row) => cleanAreaName(row.area)),
      ...vehicleRows.map((row) => cleanAreaName(row.area)),
    ].filter((area) => area && normalizeLookupValue(area) !== normalizeLookupValue("Итого")));
    const customAreas = allAreas.filter((area) => normalizeLookupValue(area) !== normalizeLookupValue(defaultAreaShiftScheduleArea));

    return [
      defaultAreaShiftScheduleArea,
      ...sortAreaNamesByOrder(customAreas, reportAreaOrder),
    ];
  }, [active, areaShiftCutoffs, ptoOperRows, ptoPlanRows, ptoSurveyRows, reportAreaOrder, reportBaseRows, vehicleRows]);
}
