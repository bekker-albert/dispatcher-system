"use client";

import { useMemo } from "react";

import { buildVehicleDisplayName } from "@/lib/domain/vehicles/import-export";
import { SectionCard } from "@/shared/ui/layout";
import { blockStyle, dispatchSuggestionStyle } from "@/features/dispatch/dispatchSectionStyles";
import { DispatchSummaryDatalists } from "@/features/dispatch/DispatchSummaryDatalists";
import { DispatchSummaryHeader } from "@/features/dispatch/DispatchSummaryHeader";
import { DispatchSummaryStats } from "@/features/dispatch/DispatchSummaryStats";
import { DispatchSummaryTable } from "@/features/dispatch/DispatchSummaryTable";
import { DispatchSummaryToolbar } from "@/features/dispatch/DispatchSummaryToolbar";
import type { DispatchSectionProps, DispatchTotals } from "@/features/dispatch/dispatchSectionTypes";

export type { DispatchSectionProps, DispatchTotals };

export default function DispatchSection({
  activeDispatchSubtabLabel,
  dispatchTab,
  activeDispatchSubtabContent,
  reportDate,
  isDailyDispatchShift,
  currentDispatchShift,
  dispatchSummaryTotals,
  search,
  onSearchChange,
  areaFilter,
  onAreaFilterChange,
  dispatchAreaOptions,
  dispatchVehicleToAddId,
  onDispatchVehicleToAddIdChange,
  dispatchVehicleOptions,
  onAddSelectedDispatchVehicle,
  onAddFilteredVehiclesToDispatchSummary,
  dispatchAiSuggestion,
  filteredDispatchSummaryRows,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
  dispatchLocationOptions,
  dispatchWorkTypeOptions,
  dispatchExcavatorOptions,
}: DispatchSectionProps) {
  const vehicleSelectOptions = useMemo(
    () => dispatchVehicleOptions.map((vehicle) => ({ value: String(vehicle.id), label: buildVehicleDisplayName(vehicle) })),
    [dispatchVehicleOptions],
  );

  return (
    <SectionCard title={activeDispatchSubtabLabel}>
      {dispatchTab.startsWith("custom:") ? (
        <div style={blockStyle}>{activeDispatchSubtabContent || "В этой подвкладке пока нет информации."}</div>
      ) : (
        <>
          <DispatchSummaryHeader
            currentDispatchShift={currentDispatchShift}
            isDailyDispatchShift={isDailyDispatchShift}
            reportDate={reportDate}
            totals={dispatchSummaryTotals}
          />

          <DispatchSummaryStats totals={dispatchSummaryTotals} />

          <DispatchSummaryToolbar
            areaFilter={areaFilter}
            dispatchAreaOptions={dispatchAreaOptions}
            dispatchVehicleToAddId={dispatchVehicleToAddId}
            isDailyDispatchShift={isDailyDispatchShift}
            onAddFilteredVehiclesToDispatchSummary={onAddFilteredVehiclesToDispatchSummary}
            onAddSelectedDispatchVehicle={onAddSelectedDispatchVehicle}
            onAreaFilterChange={onAreaFilterChange}
            onDispatchVehicleToAddIdChange={onDispatchVehicleToAddIdChange}
            onSearchChange={onSearchChange}
            search={search}
            vehicleSelectOptions={vehicleSelectOptions}
          />

          <div style={dispatchSuggestionStyle}>
            <strong>Черновик для ИИ:</strong> {dispatchAiSuggestion}
          </div>

          <DispatchSummaryTable
            isDailyDispatchShift={isDailyDispatchShift}
            rows={filteredDispatchSummaryRows}
            vehicleSelectOptions={vehicleSelectOptions}
            onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
            onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
            onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
            onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
          />

          <DispatchSummaryDatalists
            dispatchAreaOptions={dispatchAreaOptions}
            dispatchExcavatorOptions={dispatchExcavatorOptions}
            dispatchLocationOptions={dispatchLocationOptions}
            dispatchWorkTypeOptions={dispatchWorkTypeOptions}
          />
        </>
      )}
    </SectionCard>
  );
}
