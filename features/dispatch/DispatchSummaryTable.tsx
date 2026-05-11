import {
  type DispatchSummaryNumberField,
  type DispatchSummaryRow,
  type DispatchSummaryTextField,
} from "@/lib/domain/dispatch/summary";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  dispatchSummaryEmptyStyle,
  dispatchSummaryGroupCellStyle,
  dispatchSummaryGroupRowStyle,
  dispatchSummaryNumberThStyle,
  dispatchSummarySecondaryButtonStyle,
  dispatchSummaryTableScrollStyle,
  dispatchSummaryTableStyle,
  dispatchSummaryThStyle,
} from "@/features/dispatch/dispatchSectionStyles";
import { DispatchSummaryTableRow } from "@/features/dispatch/DispatchSummaryTableRow";

type DispatchSummaryTableProps = {
  isDailyDispatchShift: boolean;
  rows: DispatchSummaryRow[];
  vehicles: VehicleRow[];
  locationOptions: string[];
  structureOptions: string[];
  onAddDumpTruckToDispatchLink: (excavator: string, templateRow?: DispatchSummaryRow) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  onDeleteDispatchSummaryLink: (rowIds: string[], label: string) => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
};

type DispatchSummaryGroup = {
  id: string;
  label: string;
  location: string;
  structure: string;
  loadingRows: DispatchSummaryRow[];
  truckRows: DispatchSummaryRow[];
  unassignedRows: DispatchSummaryRow[];
};

const dispatchSummaryColumns = [
  150,
  220,
  120,
  220,
  90,
  160,
  76,
  76,
  76,
  76,
  70,
  82,
  42,
];

const dispatchSummaryHeaders = [
  ["Местонахождение", dispatchSummaryThStyle],
  ["Структура", dispatchSummaryThStyle],
  ["Вид техники", dispatchSummaryThStyle],
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
] as const;

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

function groupLocation(group: DispatchSummaryGroup) {
  return group.loadingRows[0]?.location || group.truckRows[0]?.location || group.unassignedRows[0]?.location || "";
}

function groupStructure(group: DispatchSummaryGroup) {
  return group.loadingRows[0]?.workType || group.truckRows[0]?.workType || group.unassignedRows[0]?.workType || "";
}

function createDispatchSummaryGroups(
  rows: DispatchSummaryRow[],
  vehicleById: Map<number, VehicleRow>,
): DispatchSummaryGroup[] {
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
        location: row.location,
        structure: row.workType,
        loadingRows: [],
        truckRows: [],
        unassignedRows: [],
      };

      group.loadingRows.push(row);
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
      location: row.location,
      structure: row.workType,
      loadingRows: [],
      truckRows: [],
      unassignedRows: [],
    };
    fallbackGroup.truckRows.push(row);
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
  rows,
  vehicles,
  locationOptions,
  structureOptions,
  onAddDumpTruckToDispatchLink,
  onDeleteDispatchSummaryRow,
  onDeleteDispatchSummaryLink,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryNumber,
  onUpdateDispatchSummaryText,
}: DispatchSummaryTableProps) {
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const groups = createDispatchSummaryGroups(rows, vehicleById);

  return (
    <div style={dispatchSummaryTableScrollStyle}>
      <table style={dispatchSummaryTableStyle}>
        <colgroup>
          {dispatchSummaryColumns.map((width, index) => (
            <col key={`${width}-${index}`} style={{ width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {dispatchSummaryHeaders.map(([label, style]) => (
              <th key={label || "actions"} style={style}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <DispatchSummaryTableGroupRows
              key={group.id}
              group={group}
              isDailyDispatchShift={isDailyDispatchShift}
              vehicleById={vehicleById}
              vehicles={vehicles}
              locationOptions={locationOptions}
              structureOptions={structureOptions}
              onAddDumpTruckToDispatchLink={onAddDumpTruckToDispatchLink}
              onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
              onDeleteDispatchSummaryLink={onDeleteDispatchSummaryLink}
              onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
              onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
              onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
            />
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={13} style={dispatchSummaryEmptyStyle}>
                {isDailyDispatchShift
                  ? "Сутки пока пустые: заполни ночную и дневную смену за выбранную дату."
                  : "Нет строк сводки. Добавь звено или заполни из расстановки техники."}
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
  isDailyDispatchShift,
  vehicleById,
  vehicles,
  locationOptions,
  structureOptions,
  onAddDumpTruckToDispatchLink,
  onDeleteDispatchSummaryRow,
  onDeleteDispatchSummaryLink,
  onUpdateDispatchSummaryVehicle,
  onUpdateDispatchSummaryNumber,
  onUpdateDispatchSummaryText,
}: {
  group: DispatchSummaryGroup;
  isDailyDispatchShift: boolean;
  vehicleById: Map<number, VehicleRow>;
  vehicles: VehicleRow[];
  locationOptions: string[];
  structureOptions: string[];
  onAddDumpTruckToDispatchLink: (excavator: string, templateRow?: DispatchSummaryRow) => void;
  onDeleteDispatchSummaryRow: (rowId: string) => void;
  onDeleteDispatchSummaryLink: (rowIds: string[], label: string) => void;
  onUpdateDispatchSummaryVehicle: (rowId: string, vehicleId: string) => void;
  onUpdateDispatchSummaryNumber: (rowId: string, field: DispatchSummaryNumberField, value: string) => void;
  onUpdateDispatchSummaryText: (rowId: string, field: DispatchSummaryTextField, value: string) => void;
}) {
  const rows = [
    ...group.loadingRows.map((row) => ({ row, child: false })),
    ...group.truckRows.map((row) => ({ row, child: true })),
    ...group.unassignedRows.map((row) => ({ row, child: false })),
  ];
  const rowIds = rows.map(({ row }) => row.id);
  const location = groupLocation(group) || "Без местонахождения";
  const structure = groupStructure(group) || "Без структуры";
  const templateRow = rows[0]?.row;

  return (
    <>
      <tr style={dispatchSummaryGroupRowStyle}>
        <td colSpan={13} style={dispatchSummaryGroupCellStyle}>
          <span>Звено: {location} / {structure} / {group.label}</span>
          {!isDailyDispatchShift ? (
            <span style={{ float: "right", display: "inline-flex", gap: 6 }}>
              <button
                type="button"
                style={{ ...dispatchSummarySecondaryButtonStyle, padding: "5px 8px" }}
                onClick={() => onAddDumpTruckToDispatchLink(group.label, templateRow)}
              >
                Добавить самосвал
              </button>
              <button
                type="button"
                style={{ ...dispatchSummarySecondaryButtonStyle, padding: "5px 8px" }}
                onClick={() => onDeleteDispatchSummaryLink(rowIds, group.label)}
              >
                Удалить звено
              </button>
            </span>
          ) : null}
        </td>
      </tr>
      {rows.map(({ row, child }) => (
        <DispatchSummaryTableRow
          key={row.id}
          row={row}
          isReadOnly={isDailyDispatchShift}
          isChildRow={child}
          vehicle={row.vehicleId ? vehicleById.get(row.vehicleId) : undefined}
          vehicles={vehicles}
          locationOptions={locationOptions}
          structureOptions={structureOptions}
          onUpdateDispatchSummaryText={onUpdateDispatchSummaryText}
          onUpdateDispatchSummaryNumber={onUpdateDispatchSummaryNumber}
          onUpdateDispatchSummaryVehicle={onUpdateDispatchSummaryVehicle}
          onDeleteDispatchSummaryRow={onDeleteDispatchSummaryRow}
        />
      ))}
    </>
  );
}
