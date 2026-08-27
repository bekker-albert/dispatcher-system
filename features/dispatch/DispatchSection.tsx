"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/auth/AuthContext";
import { isAuthUserSuperuser } from "@/lib/domain/auth/types";
import type { DispatchSummaryRow } from "@/lib/domain/dispatch/summary";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { SectionCard } from "@/shared/ui/layout";
import { blockStyle } from "@/features/dispatch/dispatchSectionStyles";
import { DispatchDailyVehicleSummary } from "@/features/dispatch/DispatchDailyVehicleSummary";
import { DispatchPlanFactPanel } from "@/features/dispatch/DispatchPlanFactPanel";
import { DispatchSummaryDatalists } from "@/features/dispatch/DispatchSummaryDatalists";
import { DispatchSummaryHeader } from "@/features/dispatch/DispatchSummaryHeader";
import { DispatchSummaryStats } from "@/features/dispatch/DispatchSummaryStats";
import { DispatchSummaryTable } from "@/features/dispatch/DispatchSummaryTable";
import {
  DispatchSummaryToolbar,
  type DispatchSummaryCategoryTab,
} from "@/features/dispatch/DispatchSummaryToolbar";
import type { DispatchSectionProps, DispatchTotals, DispatchVehicleSelectOption } from "@/features/dispatch/dispatchSectionTypes";

export type { DispatchSectionProps, DispatchTotals, DispatchVehicleSelectOption };

const allAreasLabel = "Все участки";

function resolveLegacyUserAreas(userText: string, options: string[]) {
  const normalizedUserText = normalizeLookupValue(userText);

  return options.filter((area) => {
    if (normalizeLookupValue(area) === normalizeLookupValue(allAreasLabel)) return false;
    const normalizedArea = normalizeLookupValue(area);
    return normalizedArea && normalizedUserText.includes(normalizedArea);
  });
}

function vehicleTypeMatches(vehicle: VehicleRow | undefined, expected: string) {
  if (!vehicle) return false;
  return normalizeLookupValue(vehicle.vehicleType) === normalizeLookupValue(expected);
}

function rowMatchesCategory(
  row: DispatchSummaryRow,
  vehicle: VehicleRow | undefined,
  category: DispatchSummaryCategoryTab,
) {
  if (category === "Простои") return row.downtimeHours > 0;
  if (category === "Ремонты") return row.repairHours > 0;

  if (!vehicle) return true;

  if (category === "Производственная") {
    return vehicleTypeMatches(vehicle, "Погрузочная")
      || vehicleTypeMatches(vehicle, "Транспортировочная")
      || Boolean(row.excavator.trim());
  }
  if (category === "Спецтехника") return vehicleTypeMatches(vehicle, "Спецтехника");
  if (category === "Вспомогательная") return vehicleTypeMatches(vehicle, "Вспомогательная");
  if (category === "Легковая/Пассажирская") {
    return vehicleTypeMatches(vehicle, "Легковая")
      || vehicleTypeMatches(vehicle, "Пассажирская")
      || vehicleTypeMatches(vehicle, "Легковая/Пассажирская");
  }

  return true;
}

export default function DispatchSection({
  dispatchTab,
  activeDispatchSubtabContent,
  reportDate,
  isDailyDispatchShift,
  currentDispatchShift,
  dailyReportTab,
  dispatchSummaryTotals,
  search,
  onSearchChange,
  areaFilter,
  onAreaFilterChange,
  dispatchAreaOptions,
  dispatchVehicleOptions,
  onAddDispatchSummaryLink,
  onAddDumpTruckToDispatchLink,
  filteredDispatchSummaryRows,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
  dispatchLocationOptions,
  dispatchWorkTypeOptions,
  dispatchPtoPlanRows,
  dispatchExcavatorOptions,
}: DispatchSectionProps) {
  const { user } = useAuth();
  const [activeCategoryTab, setActiveCategoryTab] = useState<DispatchSummaryCategoryTab>("Производственная");
  const userAreaText = `${user.displayName} ${user.positionTitle} ${user.email} ${user.login}`;
  const userAreas = useMemo(() => (
    isAuthUserSuperuser(user) || user.canManageUsers
      ? dispatchAreaOptions.filter((area) => normalizeLookupValue(area) !== normalizeLookupValue(allAreasLabel))
      : resolveLegacyUserAreas(userAreaText, dispatchAreaOptions)
  ), [dispatchAreaOptions, user, userAreaText]);
  const accessibleAreaOptions = useMemo(() => {
    if (isAuthUserSuperuser(user) || user.canManageUsers) return dispatchAreaOptions;
    if (userAreas.length === 0) return dispatchAreaOptions;
    if (userAreas.length === 1) return userAreas;
    return [allAreasLabel, ...userAreas];
  }, [dispatchAreaOptions, user, userAreas]);
  const dispatchRowAreaOptions = useMemo(() => (
    accessibleAreaOptions.filter((area) => normalizeLookupValue(area) !== normalizeLookupValue(allAreasLabel))
  ), [accessibleAreaOptions]);
  const sectionScopeMessage = useMemo(() => {
    if (isAuthUserSuperuser(user) || user.canManageUsers) return "";
    if (userAreas.length === 1) return `Участок выбран из legacy-доступов пользователя: ${userAreas[0]}.`;
    if (userAreas.length > 1) return "Пользователь имеет несколько участков по legacy-доступам.";
    return "Участок пользователя не определен. Это legacy UI layer, не server-side ERP authorization.";
  }, [user, userAreas]);
  const vehicleById = useMemo(() => (
    new Map(dispatchVehicleOptions.map((vehicle) => [vehicle.id, vehicle]))
  ), [dispatchVehicleOptions]);
  const categoryRows = useMemo(() => {
    if (isDailyDispatchShift) return filteredDispatchSummaryRows;
    return filteredDispatchSummaryRows.filter((row) => (
      rowMatchesCategory(
        row,
        row.vehicleId ? vehicleById.get(row.vehicleId) : undefined,
        activeCategoryTab,
      )
    ));
  }, [activeCategoryTab, filteredDispatchSummaryRows, isDailyDispatchShift, vehicleById]);

  useEffect(() => {
    if (!isAuthUserSuperuser(user) && !user.canManageUsers && userAreas.length === 1 && areaFilter !== userAreas[0]) {
      onAreaFilterChange(userAreas[0]);
    }
  }, [areaFilter, onAreaFilterChange, user, userAreas]);

  const planFactPanel = (
    <DispatchPlanFactPanel
      rows={filteredDispatchSummaryRows}
      percent={dispatchSummaryTotals.percent}
    />
  );
  const summaryTable = (
    <DispatchSummaryTable
      isDailyDispatchShift={isDailyDispatchShift}
      categoryTab={activeCategoryTab}
      rows={categoryRows}
      vehicles={dispatchVehicleOptions}
      areaOptions={dispatchRowAreaOptions}
      locationOptions={dispatchLocationOptions}
      structureOptions={dispatchWorkTypeOptions}
      ptoPlanRows={dispatchPtoPlanRows}
      onAddDumpTruckToDispatchLink={onAddDumpTruckToDispatchLink}
      onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
      onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
      onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
      onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
    />
  );

  return (
    <SectionCard title="" fill>
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

          {isDailyDispatchShift ? null : planFactPanel}

          <DispatchSummaryToolbar
            areaFilter={areaFilter}
            dispatchAreaOptions={accessibleAreaOptions}
            isDailyDispatchShift={isDailyDispatchShift}
            activeCategoryTab={activeCategoryTab}
            onActiveCategoryTabChange={setActiveCategoryTab}
            sectionScopeMessage={sectionScopeMessage}
            onAddDispatchSummaryLink={onAddDispatchSummaryLink}
            onAreaFilterChange={onAreaFilterChange}
            onSearchChange={onSearchChange}
            search={search}
          />

          {isDailyDispatchShift && dailyReportTab === "summary" ? (
            <>
              <DispatchSummaryStats totals={dispatchSummaryTotals} />
              <DispatchDailyVehicleSummary rows={filteredDispatchSummaryRows} />
            </>
          ) : (
            <>
              {isDailyDispatchShift ? (
                <DispatchPlanFactPanel
                  rows={filteredDispatchSummaryRows}
                  dailyMode
                  percent={dispatchSummaryTotals.percent}
                />
              ) : null}
              {summaryTable}
            </>
          )}

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
