import { useMemo } from "react";

import {
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import type { DispatchReasonCatalogGroup } from "@/lib/domain/dispatch/reason-catalog";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  dispatchSummaryEmptyStyle,
  dispatchSummaryNumberThStyle,
  dispatchSummaryTableScrollStyle,
  dispatchSummaryTableStyle,
  dispatchSummaryThStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import {
  createDispatchStructureOptionIndex,
  type DispatchStructureOptionIndex,
} from "@/features/dispatch/dispatchStructureOptions";
import { DispatchSummaryTableRow } from "@/features/dispatch/DispatchSummaryTableRow";
import type { DispatchSummaryCategoryTab } from "@/features/dispatch/DispatchSummaryToolbar";
import { useDispatchReasonCatalogs } from "@/features/dispatch/useDispatchReasonCatalogs";

type DispatchSummaryTableProps = {
  isDailyDispatchShift: boolean;
  categoryTab: DispatchSummaryCategoryTab;
  rows: DispatchSummaryRow[];
  vehicles: VehicleRow[];
  areaOptions: string[];
  locationOptions: string[];
  structureOptions: string[];
  ptoPlanRows: PtoPlanRow[];
  onAddDumpTruckToDispatchLink: (excavator: string, templateRow?: DispatchSummaryRow) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
};

type DispatchSummaryGroup = {
  id: string;
  label: string;
  area: string;
  location: string;
  structure: string;
  loadingRows: DispatchSummaryRow[];
  truckRows: DispatchSummaryRow[];
  unassignedRows: DispatchSummaryRow[];
};

const dispatchSummaryStructureMinWidth = 220;

const dispatchSummaryHeaders = [
  ["Участок", dispatchSummaryThStyle],
  ["Местонахождение", dispatchSummaryThStyle],
  ["Структура", dispatchSummaryThStyle],
  ["Наименование техники", dispatchSummaryThStyle],
  ["№", dispatchSummaryThStyle],
  ["Материал", dispatchSummaryThStyle],
  ["Аренда", dispatchSummaryNumberThStyle],
  ["Работа", dispatchSummaryNumberThStyle],
  ["Простой", dispatchSummaryNumberThStyle],
  ["Ремонт", dispatchSummaryNumberThStyle],
  ["Рейсы", dispatchSummaryNumberThStyle],
  ["Произв.", dispatchSummaryNumberThStyle],
  ["", dispatchSummaryThStyle],
  ["Группа", dispatchSummaryThStyle],
  ["Причина / вид", dispatchSummaryThStyle],
] as const;

function hiddenColumnIndexes(categoryTab: DispatchSummaryCategoryTab) {
  const hidden = new Set<number>();

  if (
    categoryTab === "Спецтехника"
    || categoryTab === "Вспомогательная"
    || categoryTab === "Легковая/Пассажирская"
  ) {
    hidden.add(5);
    hidden.add(10);
  }

  if (categoryTab === "Простои") {
    [5, 6, 7, 9, 10, 11, 12].forEach((index) => hidden.add(index));
  } else if (categoryTab === "Ремонты") {
    [5, 6, 7, 8, 10, 11, 12].forEach((index) => hidden.add(index));
  } else {
    hidden.add(13);
    hidden.add(14);
  }

  return hidden;
}

function headerLabel(index: number, categoryTab: DispatchSummaryCategoryTab) {
  if (index === 13) return categoryTab === "Ремонты" ? "Группа ремонта" : "Группа простоя";
  if (index === 14) return categoryTab === "Ремонты" ? "Вид ремонта" : "Причина простоя";
  return dispatchSummaryHeaders[index][0];
}

function normalizeGroupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function vehicleDisplayKeys(vehicle: VehicleRow | undefined, row: DispatchSummaryRow) {
  return [
    row.vehicleName,
    row.excavator,
    vehicle?.name,
    vehicle?.garageNumber,
    vehicle?.plateNumber,
    [vehicle?.brand, vehicle?.model].filter(Boolean).join(" "),
  ]
    .map((value) => normalizeGroupKey(value ?? ""))
    .filter(Boolean);
}

function isLoadingEquipment(vehicle: VehicleRow | undefined, row: DispatchSummaryRow) {
  const text = [
    vehicle?.vehicleType,
    vehicle?.equipmentType,
    vehicle?.brand,
    vehicle?.model,
    row.vehicleName,
  ].join(" ").toLowerCase();

  return /экскават|погруз|loader|shovel|фронтал/.test(text);
}

function createDispatchSummaryGroups(
  rows: DispatchSummaryRow[],
  vehicleById: Map<number, VehicleRow>,
  categoryTab: DispatchSummaryCategoryTab,
): DispatchSummaryGroup[] {
  if (categoryTab !== "Производственная") {
    return rows.length > 0 ? [{
      id: `category:${categoryTab}`,
      label: categoryTab,
      area: rows[0]?.area ?? "",
      location: rows[0]?.location ?? "",
      structure: rows[0]?.workType ?? "",
      loadingRows: [],
      truckRows: [],
      unassignedRows: rows,
    }] : [];
  }

  const loaderGroups = new Map<string, DispatchSummaryGroup>();
  const pendingTruckRows: DispatchSummaryRow[] = [];
  const unassignedRows: DispatchSummaryRow[] = [];

  rows.forEach((row) => {
    const vehicle = row.vehicleId ? vehicleById.get(row.vehicleId) : undefined;
    if (isLoadingEquipment(vehicle, row)) {
      const keys = vehicleDisplayKeys(vehicle, row);
      const groupKey = keys[0] || `loader:${row.id}`;
      const label = row.vehicleName || row.excavator || "Погрузочная техника";
      const group = loaderGroups.get(groupKey) ?? {
        id: groupKey,
        label,
        area: row.area,
        location: row.location,
        structure: row.workType,
        loadingRows: [],
        truckRows: [],
        unassignedRows: [],
      };

      group.loadingRows.push(row);
      group.area ||= row.area;
      group.location ||= row.location;
      group.structure ||= row.workType;
      keys.forEach((key) => loaderGroups.set(key, group));
      return;
    }

    if (row.excavator.trim()) {
      pendingTruckRows.push(row);
      return;
    }

    unassignedRows.push(row);
  });

  const fallbackGroups = new Map<string, DispatchSummaryGroup>();
  pendingTruckRows.forEach((row) => {
    const key = normalizeGroupKey(row.excavator);
    const loaderGroup = loaderGroups.get(key);
    if (loaderGroup) {
      loaderGroup.truckRows.push(row);
      loaderGroup.location ||= row.location;
      loaderGroup.structure ||= row.workType;
      return;
    }

    const fallbackGroup = fallbackGroups.get(key) ?? {
      id: `excavator:${key || row.id}`,
      label: row.excavator || "Без привязки",
      area: row.area,
      location: row.location,
      structure: row.workType,
      loadingRows: [],
      truckRows: [],
      unassignedRows: [],
    };
    fallbackGroup.truckRows.push(row);
    fallbackGroup.area ||= row.area;
    fallbackGroup.location ||= row.location;
    fallbackGroup.structure ||= row.workType;
    fallbackGroups.set(key, fallbackGroup);
  });

  const uniqueLoaderGroups = Array.from(new Set(loaderGroups.values()));
  const groups = [...uniqueLoaderGroups, ...fallbackGroups.values()]
    .sort((left, right) => left.label.localeCompare(right.label, "ru"));

  if (unassignedRows.length > 0) {
    groups.push({
      id: "unassigned",
      label: "Без привязки",
      area: unassignedRows[0]?.area ?? "",
      location: unassignedRows[0]?.location ?? "",
      structure: unassignedRows[0]?.workType ?? "",
      loadingRows: [],
      truckRows: [],
      unassignedRows,
    });
  }

  return groups;
}

export function DispatchSummaryTable({
  isDailyDispatchShift,
  categoryTab,
  rows,
  vehicles,
  areaOptions,
  locationOptions,
  structureOptions,
  ptoPlanRows,
  onAddDumpTruckToDispatchLink,
  onDeleteDispatchSummaryRow,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryNumber,
  onUpdateDispatchSummaryText,
}: DispatchSummaryTableProps) {
  const vehicleById = useMemo(() => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])), [vehicles]);
  const ptoPlanIndex = useMemo(() => (
    ptoPlanRows.length > 0 ? createDispatchStructureOptionIndex(ptoPlanRows) : null
  ), [ptoPlanRows]);
  const groups = useMemo(() => (
    createDispatchSummaryGroups(rows, vehicleById, categoryTab)
  ), [categoryTab, rows, vehicleById]);
  const { catalogs } = useDispatchReasonCatalogs();
  const reasonGroups = categoryTab === "Простои"
    ? catalogs.downtime
    : categoryTab === "Ремонты"
      ? catalogs.repair
      : [];
  const hiddenColumns = hiddenColumnIndexes(categoryTab);
  const visibleColumnIndexes = dispatchSummaryHeaders
    .map((_, index) => index)
    .filter((index) => !hiddenColumns.has(index));

  return (
    <div style={dispatchSummaryTableScrollStyle}>
      <table style={{ ...dispatchSummaryTableStyle, minWidth: 0, tableLayout: "auto" }}>
        <thead>
          <tr>
            {visibleColumnIndexes.map((index) => {
              const [, style] = dispatchSummaryHeaders[index];
              const resolvedStyle = index === 2
                ? { ...style, minWidth: dispatchSummaryStructureMinWidth }
                : style;
              return <th key={`${index}-${headerLabel(index, categoryTab)}`} style={resolvedStyle}>{headerLabel(index, categoryTab)}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <DispatchSummaryTableGroupRows
              key={group.id}
              group={group}
              categoryTab={categoryTab}
              reasonGroups={reasonGroups}
              isDailyDispatchShift={isDailyDispatchShift}
              vehicleById={vehicleById}
              vehicles={vehicles}
              areaOptions={areaOptions}
              locationOptions={locationOptions}
              structureOptions={structureOptions}
              ptoPlanIndex={ptoPlanIndex}
              onAddDumpTruckToDispatchLink={onAddDumpTruckToDispatchLink}
              onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
              onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
              onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
              onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
            />
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumnIndexes.length} style={dispatchSummaryEmptyStyle}>
                {isDailyDispatchShift
                  ? "Сутки пока пустые: заполни ночную и дневную смену за выбранную дату."
                  : `Нет строк в разделе «${categoryTab}».`}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function DispatchSummaryTableGroupRows({
  group,
  categoryTab,
  reasonGroups,
  isDailyDispatchShift,
  vehicleById,
  vehicles,
  areaOptions,
  locationOptions,
  structureOptions,
  ptoPlanIndex,
  onAddDumpTruckToDispatchLink,
  onDeleteDispatchSummaryRow,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryNumber,
  onUpdateDispatchSummaryText,
}: {
  group: DispatchSummaryGroup;
  categoryTab: DispatchSummaryCategoryTab;
  reasonGroups: DispatchReasonCatalogGroup[];
  isDailyDispatchShift: boolean;
  vehicleById: Map<number, VehicleRow>;
  vehicles: VehicleRow[];
  areaOptions: string[];
  locationOptions: string[];
  structureOptions: string[];
  ptoPlanIndex: DispatchStructureOptionIndex | null;
  onAddDumpTruckToDispatchLink: (excavator: string, templateRow?: DispatchSummaryRow) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
}) {
  const linkedTruckTrips = group.truckRows.reduce((sum, row) => (
    sum + (Number.isFinite(row.trips) ? row.trips : 0)
  ), 0);
  const rows = [
    ...group.loadingRows.map((row) => ({ row, role: "loading" as const })),
    ...group.truckRows.map((row) => ({ row, role: "truck" as const })),
    ...group.unassignedRows.map((row) => ({ row, role: "unassigned" as const })),
  ];

  return (
    <>
      {rows.map(({ row, role }) => (
        <DispatchSummaryTableRow
          key={row.id}
          row={row}
          isReadOnly={isDailyDispatchShift}
          rowRole={role}
          categoryTab={categoryTab}
          reasonGroups={reasonGroups}
          linkedTruckTrips={role === "loading" ? linkedTruckTrips : undefined}
          hasLinkedTrucks={role === "loading" ? group.truckRows.length > 0 : undefined}
          vehicle={row.vehicleId ? vehicleById.get(row.vehicleId) : undefined}
          vehicles={vehicles}
          areaOptions={areaOptions}
          locationOptions={locationOptions}
          structureOptions={structureOptions}
          ptoPlanIndex={ptoPlanIndex}
          onAddDumpTruckToCurrentLink={categoryTab === "Производственная" && role === "loading"
            ? () => onAddDumpTruckToDispatchLink(group.label, row)
            : undefined}
          onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
          onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
          onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
          onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
        />
      ))}
    </>
  );
}
