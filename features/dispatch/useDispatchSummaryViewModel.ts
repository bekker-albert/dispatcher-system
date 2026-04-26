import { useMemo } from "react";

import {
  buildDispatchAiSuggestion,
  consolidateDispatchSummaryRows,
  dispatchShiftFromTab,
  type DispatchSummaryRow,
} from "@/lib/domain/dispatch/summary";
import type { ReportRow } from "@/lib/domain/reports/types";
import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

type UseDispatchSummaryViewModelOptions = {
  active: boolean;
  areaFilter: string;
  search: string;
  dispatchTab: string;
  reportDate: string;
  vehicleRows: VehicleRow[];
  dispatchSummaryRows: DispatchSummaryRow[];
  reportBaseRows: ReportRow[];
};

export function useDispatchSummaryViewModel({
  active,
  areaFilter,
  search,
  dispatchTab,
  reportDate,
  vehicleRows,
  dispatchSummaryRows,
  reportBaseRows,
}: UseDispatchSummaryViewModelOptions) {
  const filteredDispatch = useMemo(() => {
    if (!active) return [];

    return vehicleRows.filter((vehicle) => {
      if (vehicle.visible === false) return false;
      const areaOk = areaFilter === "Все участки" || vehicle.area === areaFilter;
      const normalizedSearch = search.trim().toLowerCase();
      const textOk = normalizedSearch === "" || [
        buildVehicleDisplayName(vehicle),
        vehicle.area,
        vehicle.location,
        vehicle.workType,
        vehicle.excavator,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      return areaOk && textOk;
    });
  }, [active, areaFilter, search, vehicleRows]);

  const currentDispatchShift = dispatchShiftFromTab(dispatchTab);
  const isDailyDispatchShift = currentDispatchShift === "daily";

  const dispatchAreaOptions = useMemo(() => [
    "Все участки",
    ...(active
      ? uniqueSorted([
          ...vehicleRows.map((vehicle) => vehicle.area),
          ...dispatchSummaryRows.map((row) => row.area),
          ...reportBaseRows.map((row) => row.area),
        ]).filter((area) => normalizeLookupValue(area) !== normalizeLookupValue("Итого"))
      : []),
  ], [active, dispatchSummaryRows, reportBaseRows, vehicleRows]);

  const dispatchVehicleOptions = useMemo(() => (
    active
      ? vehicleRows
          .filter((vehicle) => vehicle.visible !== false)
          .sort((left, right) => buildVehicleDisplayName(left).localeCompare(buildVehicleDisplayName(right), "ru"))
      : []
  ), [active, vehicleRows]);

  const dispatchLocationOptions = useMemo(() => uniqueSorted([
    ...(active ? vehicleRows.map((vehicle) => vehicle.location) : []),
    ...(active ? dispatchSummaryRows.map((row) => row.location) : []),
  ]), [active, dispatchSummaryRows, vehicleRows]);

  const dispatchWorkTypeOptions = useMemo(() => uniqueSorted([
    ...(active ? vehicleRows.map((vehicle) => vehicle.workType) : []),
    ...(active ? dispatchSummaryRows.map((row) => row.workType) : []),
    ...(active ? reportBaseRows.map((row) => row.name) : []),
  ]), [active, dispatchSummaryRows, reportBaseRows, vehicleRows]);

  const dispatchExcavatorOptions = useMemo(() => uniqueSorted([
    ...(active ? vehicleRows.map((vehicle) => vehicle.excavator) : []),
    ...(active ? dispatchSummaryRows.map((row) => row.excavator) : []),
  ]), [active, dispatchSummaryRows, vehicleRows]);

  const currentDispatchSummaryRows = useMemo(() => (
    !active
      ? []
      : isDailyDispatchShift
      ? consolidateDispatchSummaryRows(dispatchSummaryRows, reportDate)
      : dispatchSummaryRows.filter((row) => row.date === reportDate && row.shift === currentDispatchShift)
  ), [active, currentDispatchShift, dispatchSummaryRows, isDailyDispatchShift, reportDate]);

  const filteredDispatchSummaryRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return currentDispatchSummaryRows.filter((row) => {
      const areaOk = areaFilter === "Все участки" || normalizeLookupValue(row.area) === normalizeLookupValue(areaFilter);
      const textOk = normalizedSearch === "" || [
        row.vehicleName,
        row.area,
        row.location,
        row.workType,
        row.excavator,
        row.reason,
        row.comment,
      ].join(" ").toLowerCase().includes(normalizedSearch);

      return areaOk && textOk;
    });
  }, [areaFilter, currentDispatchSummaryRows, search]);

  const dispatchSummaryTotals = useMemo(() => {
    const totals = filteredDispatchSummaryRows.reduce((result, row) => ({
      plan: result.plan + row.planVolume,
      fact: result.fact + row.factVolume,
      workHours: result.workHours + row.workHours,
      repairHours: result.repairHours + row.repairHours,
      downtimeHours: result.downtimeHours + row.downtimeHours,
      trips: result.trips + row.trips,
    }), {
      plan: 0,
      fact: 0,
      workHours: 0,
      repairHours: 0,
      downtimeHours: 0,
      trips: 0,
    });
    const delta = totals.fact - totals.plan;
    const percent = totals.plan > 0 ? Math.round((totals.fact / totals.plan) * 100) : totals.fact > 0 ? 100 : 0;
    const productivity = totals.workHours > 0 ? totals.fact / totals.workHours : 0;

    return { ...totals, delta, percent, productivity };
  }, [filteredDispatchSummaryRows]);

  const dispatchAiSuggestion = useMemo(() => (
    buildDispatchAiSuggestion(filteredDispatchSummaryRows)
  ), [filteredDispatchSummaryRows]);

  return {
    filteredDispatch,
    currentDispatchShift,
    isDailyDispatchShift,
    dispatchAreaOptions,
    dispatchVehicleOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchExcavatorOptions,
    currentDispatchSummaryRows,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
  };
}
