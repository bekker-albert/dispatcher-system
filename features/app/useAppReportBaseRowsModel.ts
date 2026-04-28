"use client";

import { useAreaShiftScheduleAreas } from "@/features/reports/useAreaShiftScheduleAreas";
import { useReportRowsModel } from "@/features/reports/useReportRowsModel";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";

type UseAppReportBaseRowsModelOptions = {
  needsReportBaseRows: boolean;
  needsAreaShiftScheduleAreas: boolean;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  deferredVehicleRows: VehicleRow[];
  reportDate: string;
  reportReasons: Record<string, string>;
  areaShiftCutoffs: AreaShiftCutoffMap;
  reportAreaOrder: string[];
};

export function useAppReportBaseRowsModel({
  needsReportBaseRows,
  needsAreaShiftScheduleAreas,
  deferredPtoPlanRows,
  deferredPtoSurveyRows,
  deferredPtoOperRows,
  deferredVehicleRows,
  reportDate,
  reportReasons,
  areaShiftCutoffs,
  reportAreaOrder,
}: UseAppReportBaseRowsModelOptions) {
  const {
    reportBaseRows,
  } = useReportRowsModel({
    needsReportRows: needsReportBaseRows,
    needsReportIndexes: false,
    needsAutoReportRows: false,
    deferredPtoPlanRows,
    deferredPtoSurveyRows,
    deferredPtoOperRows,
    reportDate,
    reportReasons,
  });

  const areaShiftScheduleAreas = useAreaShiftScheduleAreas({
    active: needsAreaShiftScheduleAreas,
    areaShiftCutoffs,
    reportBaseRows,
    ptoPlanRows: deferredPtoPlanRows,
    ptoOperRows: deferredPtoOperRows,
    ptoSurveyRows: deferredPtoSurveyRows,
    vehicleRows: deferredVehicleRows,
    reportAreaOrder,
  });

  return {
    reportBaseRows,
    areaShiftScheduleAreas,
  };
}
