"use client";

import { useMemo, type ChangeEvent } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  buildDispatchSummaryRowView,
  dispatchNumberInputValue,
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import type { DispatchReasonCatalogGroup } from "@/lib/domain/dispatch/reason-catalog";
import { formatPtoCellNumber } from "@/lib/domain/pto/formatting";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { normalizeLookupValue } from "@/lib/utils/text";
import { MiniIconButton } from "@/shared/ui/buttons";
import {
  dispatchSummaryActionGroupStyle,
  dispatchSummaryActionTdStyle,
  dispatchSummaryBadRowStyle,
  dispatchSummaryInputStyle,
  dispatchSummaryLoaderRowStyle,
  dispatchSummaryMutedTextStyle,
  dispatchSummaryNumberInputStyle,
  dispatchSummaryReadonlyNumberStyle,
  dispatchSummaryTdNumberStyle,
  dispatchSummaryTdStyle,
  dispatchSummaryTruckCellStyle,
  dispatchSummaryTruckRowStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import { DispatchVehiclePicker } from "./DispatchVehiclePicker";
import { buildDispatchVehicleLabel } from "./dispatchVehicleLabel";
import {
  dispatchRowExceedsHourLimit,
  dispatchRowHourTotal,
  dispatchShiftHourLimit,
} from "./dispatchHoursValidation";
import {
  type DispatchStructureOptionIndex,
  getDispatchLocationOptionsFromIndex,
  getDispatchStructureOptionsFromIndex,
} from "./dispatchStructureOptions";
import type { DispatchSummaryCategoryTab } from "./DispatchSummaryToolbar";

export type DispatchSummaryTableRowProps = {
  row: DispatchSummaryRow;
  isReadOnly: boolean;
  rowRole: "loading" | "truck" | "unassigned";
  categoryTab: DispatchSummaryCategoryTab;
  reasonGroups: DispatchReasonCatalogGroup[];
  linkedTruckTrips?: number;
  hasLinkedTrucks?: boolean;
  vehicle?: VehicleRow;
  vehicles: VehicleRow[];
  areaOptions: string[];
  locationOptions: string[];
  structureOptions: string[];
  ptoPlanIndex: DispatchStructureOptionIndex | null;
  onAddDumpTruckToCurrentLink?: () => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
};

function optionValues(values: string[], current: string) {
  const unique = Array.from(new Set([current, ...values].map((value) => value.trim()).filter(Boolean)));
  return unique.sort((left, right) => left.localeCompare(right, "ru"));
}

function optionMatches(values: string[], current: string) {
  const normalizedCurrent = normalizeLookupValue(current);
  return !normalizedCurrent || values.some((value) => normalizeLookupValue(value) === normalizedCurrent);
}

export function DispatchSummaryTableRow({
  row,
  isReadOnly,
  rowRole,
  categoryTab,
  reasonGroups,
  linkedTruckTrips,
  hasLinkedTrucks = false,
  vehicle,
  vehicles,
  areaOptions,
  locationOptions,
  structureOptions,
  ptoPlanIndex,
  onAddDumpTruckToCurrentLink,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryText,
  onUpdateDispatchSummaryNumber,
  onDeleteDispatchSummaryRow,
}: DispatchSummaryTableRowProps) {
  const rowView = buildDispatchSummaryRowView(row);
  const productivityText = formatPtoCellNumber(rowView.productivity);
  const hoursError = dispatchRowExceedsHourLimit(row);
  const isTruckRow = rowRole === "truck";
  const isLoadingRow = rowRole === "loading";
  const isDowntimeTab = categoryTab === "Простои";
  const isRepairTab = categoryTab === "Ремонты";
  const isReasonTab = isDowntimeTab || isRepairTab;
  const isNonProductionVehicleTab = categoryTab === "Спецтехника"
    || categoryTab === "Вспомогательная"
    || categoryTab === "Легковая/Пассажирская";
  const hideMaterial = isNonProductionVehicleTab || isReasonTab;
  const hideRentAndWork = isReasonTab;
  const hideDowntime = isRepairTab;
  const hideRepair = isDowntimeTab;
  const hideTrips = isNonProductionVehicleTab || isReasonTab;
  const hideProductivity = isReasonTab;
  const hideActions = isReasonTab;
  const displayedTrips = isLoadingRow && typeof linkedTruckTrips === "number" ? linkedTruckTrips : row.trips;
  const materialLockedToTrucks = isLoadingRow && hasLinkedTrucks;
  const rowStyle = {
    ...(isTruckRow ? dispatchSummaryTruckRowStyle : dispatchSummaryLoaderRowStyle),
    ...(hoursError ? dispatchSummaryBadRowStyle : {}),
  };
  const vehicleCellStyle = isTruckRow ? { ...dispatchSummaryTdStyle, ...dispatchSummaryTruckCellStyle } : dispatchSummaryTdStyle;
  const rowLocationOptions = useMemo(() => {
    if (!ptoPlanIndex) return locationOptions;
    return getDispatchLocationOptionsFromIndex(ptoPlanIndex, row.area);
  }, [locationOptions, ptoPlanIndex, row.area]);
  const rowStructureOptions = useMemo(() => {
    if (!ptoPlanIndex) return structureOptions;
    return getDispatchStructureOptionsFromIndex(ptoPlanIndex, row.area, row.location);
  }, [ptoPlanIndex, row.area, row.location, structureOptions]);

  const reasonGroupValue = isRepairTab ? row.repairReasonGroup : row.downtimeReasonGroup;
  const reasonValue = isRepairTab ? row.repairReason : row.downtimeReason;
  const selectedReasonGroup = reasonGroups.find((group) => normalizeLookupValue(group.name) === normalizeLookupValue(reasonGroupValue));
  const reasonItems = selectedReasonGroup?.items ?? [];
  const selectedReasonItem = reasonItems.find((item) => normalizeLookupValue(item.name) === normalizeLookupValue(reasonValue));
  const repairDetails = isRepairTab ? (selectedReasonItem?.items ?? []) : [];

  const handleTextChange = (field: DispatchSummaryTextField) => (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    onUpdateDispatchSummaryText(row.id, field, event.target.value);
  };
  const handleAreaChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextArea = event.target.value;
    const nextLocations = ptoPlanIndex ? getDispatchLocationOptionsFromIndex(ptoPlanIndex, nextArea) : [];
    const shouldClearLocation = Boolean(ptoPlanIndex) && !optionMatches(nextLocations, row.location);
    const nextLocation = shouldClearLocation ? "" : row.location;
    const nextStructures = ptoPlanIndex ? getDispatchStructureOptionsFromIndex(ptoPlanIndex, nextArea, nextLocation) : [];
    const shouldClearStructure = Boolean(ptoPlanIndex) && !optionMatches(nextStructures, row.workType);
    onUpdateDispatchSummaryText(row.id, "area", nextArea);
    if (shouldClearLocation) onUpdateDispatchSummaryText(row.id, "location", "");
    if (shouldClearStructure) onUpdateDispatchSummaryText(row.id, "workType", "");
  };
  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocation = event.target.value;
    const nextStructures = ptoPlanIndex ? getDispatchStructureOptionsFromIndex(ptoPlanIndex, row.area, nextLocation) : [];
    const shouldClearStructure = Boolean(ptoPlanIndex) && !optionMatches(nextStructures, row.workType);
    onUpdateDispatchSummaryText(row.id, "location", nextLocation);
    if (shouldClearStructure) onUpdateDispatchSummaryText(row.id, "workType", "");
  };
  const handleNumberChange = (field: DispatchSummaryNumberField) => (event: ChangeEvent<HTMLInputElement>) => {
    onUpdateDispatchSummaryNumber(row.id, field, event.target.value);
  };
  const handleReasonGroupChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (isRepairTab) {
      onUpdateDispatchSummaryText(row.id, "repairReasonGroup", value);
      onUpdateDispatchSummaryText(row.id, "repairReason", "");
      onUpdateDispatchSummaryText(row.id, "repairReasonDetail", "");
    } else {
      onUpdateDispatchSummaryText(row.id, "downtimeReasonGroup", value);
      onUpdateDispatchSummaryText(row.id, "downtimeReason", "");
    }
    onUpdateDispatchSummaryText(row.id, "reason", "");
  };
  const handleReasonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onUpdateDispatchSummaryText(row.id, isRepairTab ? "repairReason" : "downtimeReason", value);
    if (isRepairTab) onUpdateDispatchSummaryText(row.id, "repairReasonDetail", "");
    onUpdateDispatchSummaryText(row.id, "reason", value);
  };
  const handleRepairDetailChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onUpdateDispatchSummaryText(row.id, "repairReasonDetail", value);
    onUpdateDispatchSummaryText(row.id, "reason", value || row.repairReason);
  };

  const equipmentName = vehicle ? buildDispatchVehicleLabel(vehicle) : row.vehicleName.trim();

  return (
    <tr style={rowStyle}>
      {isTruckRow ? (
        <><td style={dispatchSummaryTdStyle} /><td style={dispatchSummaryTdStyle} /><td style={dispatchSummaryTdStyle} /></>
      ) : (
        <>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly} value={row.area} onChange={handleAreaChange} style={dispatchSummaryInputStyle}>
              <option value="">Участок</option>
              {optionValues(areaOptions, row.area).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </td>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly} value={row.location} onChange={handleLocationChange} style={dispatchSummaryInputStyle}>
              <option value="">Местонахождение</option>
              {optionValues(rowLocationOptions, row.location).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </td>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly || rowStructureOptions.length === 0} value={row.workType} onChange={handleTextChange("workType")} style={dispatchSummaryInputStyle}>
              <option value="">{rowStructureOptions.length === 0 ? "Нет структур в плане для выбранной связки" : "Структура"}</option>
              {optionValues(rowStructureOptions, row.workType).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </td>
        </>
      )}
      <td style={vehicleCellStyle}>
        <div title={equipmentName || (isTruckRow ? "Выберите самосвал по гаражному номеру" : "Техника не выбрана")} style={{ minHeight: 28, display: "flex", alignItems: "center", gap: 6, padding: "0 4px", fontWeight: equipmentName ? 600 : 400, color: equipmentName ? "#0f172a" : "#64748b" }}>
          {isTruckRow ? <span aria-hidden>↳</span> : null}<span>{equipmentName || (isTruckRow ? "Выберите самосвал" : "—")}</span>
        </div>
      </td>
      <td style={dispatchSummaryTdStyle}>
        <DispatchVehiclePicker disabled={isReadOnly} isTruckRow={isTruckRow} categoryTab={categoryTab} value={row.vehicleId} vehicle={vehicle} vehicles={vehicles} onChange={(vehicleId) => onUpdateDispatchSummaryVehicle(row.id, vehicleId)} />
      </td>
      {hideMaterial ? null : (
        <td style={dispatchSummaryTdStyle}>
          <input type="text" disabled={materialLockedToTrucks} readOnly={isReadOnly || materialLockedToTrucks} value={materialLockedToTrucks ? "" : (row.material ?? "")} onChange={handleTextChange("material")} placeholder={materialLockedToTrucks ? "—" : "Материал"} style={dispatchSummaryInputStyle} title={materialLockedToTrucks ? "Материал задается по каждому самосвалу" : undefined} />
        </td>
      )}
      {hideRentAndWork ? null : (
        <><td style={dispatchSummaryTdNumberStyle}><input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.rentHours)} onChange={handleNumberChange("rentHours")} style={dispatchSummaryNumberInputStyle} /></td><td style={dispatchSummaryTdNumberStyle}><input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.workHours)} onChange={handleNumberChange("workHours")} style={dispatchSummaryNumberInputStyle} /></td></>
      )}
      {hideDowntime ? null : <td style={dispatchSummaryTdNumberStyle}><input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.downtimeHours)} onChange={handleNumberChange("downtimeHours")} style={dispatchSummaryNumberInputStyle} /></td>}
      {hideRepair ? null : <td style={dispatchSummaryTdNumberStyle}><input readOnly={isReadOnly} inputMode="numeric" step={1} min={0} value={dispatchNumberInputValue(row.repairHours)} onChange={handleNumberChange("repairHours")} style={dispatchSummaryNumberInputStyle} /></td>}
      {hideTrips ? null : (
        <td style={dispatchSummaryTdNumberStyle}><input disabled={isLoadingRow} readOnly={isReadOnly || isLoadingRow} inputMode="numeric" step={1} min={0} value={isLoadingRow ? String(displayedTrips) : dispatchNumberInputValue(displayedTrips)} onChange={handleNumberChange("trips")} style={dispatchSummaryNumberInputStyle} title={isLoadingRow ? "Сумма рейсов привязанных самосвалов" : undefined} /></td>
      )}
      {hideProductivity ? null : (
        <td style={dispatchSummaryReadonlyNumberStyle}>{productivityText}{hoursError ? <div style={{ ...dispatchSummaryMutedTextStyle, color: "#b45309" }}>{dispatchRowHourTotal(row)} / {dispatchShiftHourLimit} ч.</div> : null}</td>
      )}
      {hideActions ? null : (
        <td style={dispatchSummaryActionTdStyle}>{!isReadOnly ? <div style={dispatchSummaryActionGroupStyle}>{onAddDumpTruckToCurrentLink ? <MiniIconButton label="Добавить самосвал под эту погрузочную" onClick={onAddDumpTruckToCurrentLink}><Plus size={14} aria-hidden /></MiniIconButton> : null}<MiniIconButton label="Удалить строку сводки" onClick={() => onDeleteDispatchSummaryRow(row.id)}><Trash2 size={14} aria-hidden /></MiniIconButton></div> : null}</td>
      )}
      {isReasonTab ? (
        <>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly || reasonGroups.length === 0} value={reasonGroupValue} onChange={handleReasonGroupChange} style={dispatchSummaryInputStyle}>
              <option value="">{reasonGroups.length === 0 ? "Справочник пуст" : "Выберите группу"}</option>
              {reasonGroups.map((group) => <option key={group.id} value={group.name}>{group.name}</option>)}
            </select>
          </td>
          <td style={dispatchSummaryTdStyle}>
            <select disabled={isReadOnly || !reasonGroupValue || reasonItems.length === 0} value={reasonValue} onChange={handleReasonChange} style={dispatchSummaryInputStyle}>
              <option value="">{!reasonGroupValue ? "Сначала выберите группу" : reasonItems.length === 0 ? "Нет значений второго уровня" : isRepairTab ? "Выберите вид ремонта" : "Выберите причину"}</option>
              {reasonItems.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </td>
          {isRepairTab ? (
            <td style={dispatchSummaryTdStyle}>
              <select disabled={isReadOnly || !reasonValue || repairDetails.length === 0} value={row.repairReasonDetail} onChange={handleRepairDetailChange} style={dispatchSummaryInputStyle}>
                <option value="">{!reasonValue ? "Сначала выберите 2 уровень" : repairDetails.length === 0 ? "Нет значений третьего уровня" : "Выберите 3 уровень"}</option>
                {repairDetails.map((detail) => <option key={detail.id} value={detail.name}>{detail.name}</option>)}
              </select>
            </td>
          ) : null}
        </>
      ) : null}
    </tr>
  );
}
