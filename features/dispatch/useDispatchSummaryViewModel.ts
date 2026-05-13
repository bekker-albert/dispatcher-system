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
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import { normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";
import {
  createDispatchLocationOptionsFromPtoPlan,
  createDispatchStructureOptionsFromPtoPlan,
} from "./dispatchStructureOptions";

type UseDispatchSummaryViewModelOptions = {
  active: boolean;
  areaFilter: string;
  search: string;
  dispatchTab: string;
  reportDate: string;
  vehicleRows: VehicleRow[];
  dispatchSummaryRows: DispatchSummaryRow[];
  reportBaseRows: ReportRow[];
  ptoPlanRows: PtoPlanRow[];
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
  ptoPlanRows,
}: UseDispatchSummaryViewModelOptions) {
  const currentDispatchShift = dispatchShiftFromTab(dispatchTab);
  const isDailyDispatchShift = currentDispatchShift === "daily";
  const normalizedDispatchSearch = useMemo(() => (
    currentDispatchShift === "daily" ? search.trim().toLowerCase() : ""
  ), [currentDispatchShift, search]);
  const vehicleSearchRecords = useMemo(() => (
    !active
      ? []
      : vehicleRows
          .filter((vehicle) => vehicle.visible !== false)
          .map((vehicle) => {
            const displayName = buildVehicleDisplayName(vehicle);

            return {
              vehicle,
              displayName,
              searchText: [
                displayName,
                vehicle.area,
                vehicle.location,
                vehicle.workType,
                vehicle.excavator,
              ].join(" ").toLowerCase(),
            };
          })
  ), [active, vehicleRows]);

  const filteredDispatch = useMemo(() => {
    if (!active) return [];

    return vehicleSearchRecords
      .filter(({ vehicle, searchText }) => {
        const areaOk = areaFilter === "Все участки" || vehicle.area === areaFilter;
        const textOk = normalizedDispatchSearch === "" || searchText.includes(normalizedDispatchSearch);

        return areaOk && textOk;
      })
      .map(({ vehicle }) => vehicle);
  }, [active, areaFilter, normalizedDispatchSearch, vehicleSearchRecords]);

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

  const sortedVehicleSearchRecords = useMemo(() => (
    active
      ? [...vehicleSearchRecords]
          .sort((left, right) => left.displayName.localeCompare(right.displayName, "ru"))
      : []
  ), [active, vehicleSearchRecords]);
  const dispatchVehicleOptions = useMemo(() => (
    sortedVehicleSearchRecords.map(({ vehicle }) => vehicle)
  ), [sortedVehicleSearchRecords]);
  const dispatchVehicleSelectOptions = useMemo(() => (
    sortedVehicleSearchRecords.map(({ vehicle, displayName }) => ({ value: String(vehicle.id), label: displayName }))
  ), [sortedVehicleSearchRecords]);

  const dispatchLocationOptions = useMemo(() => uniqueSorted([
    ...(active ? createDispatchLocationOptionsFromPtoPlan(ptoPlanRows, areaFilter) : []),
    ...(active ? dispatchSummaryRows.map((row) => row.location) : []),
  ]), [active, areaFilter, dispatchSummaryRows, ptoPlanRows]);

  const dispatchWorkTypeOptions = useMemo(() => uniqueSorted([
    ...(active ? createDispatchStructureOptionsFromPtoPlan(ptoPlanRows, areaFilter) : []),
    ...(active ? dispatchSummaryRows.map((row) => row.workType) : []),
  ]), [active, areaFilter, dispatchSummaryRows, ptoPlanRows]);

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
    return currentDispatchSummaryRows.filter((row) => {
      const areaOk = areaFilter === "Все участки" || normalizeLookupValue(row.area) === normalizeLookupValue(areaFilter);
      const textOk = normalizedDispatchSearch === "" || [
        row.vehicleName,
        row.area,
        row.location,
        row.workType,
        row.excavator,
        row.reason,
        row.comment,
      ].join(" ").toLowerCase().includes(normalizedDispatchSearch);

      return areaOk && textOk;
    });
  }, [areaFilter, currentDispatchSummaryRows, normalizedDispatchSearch]);

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
    dispatchVehicleSelectOptions,
    dispatchLocationOptions,
    dispatchWorkTypeOptions,
    dispatchPtoPlanRows: active ? ptoPlanRows : [],
    dispatchExcavatorOptions,
    currentDispatchSummaryRows,
    filteredDispatchSummaryRows,
    dispatchSummaryTotals,
    dispatchAiSuggestion,
  };
}
