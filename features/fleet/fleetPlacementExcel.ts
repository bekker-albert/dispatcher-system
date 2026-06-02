import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { findTableColumn, parseTableImportFile } from "@/lib/utils/xlsx";

export const fleetPlacementStorageKey = "aam.dispatch.fleetPlacement.v1";

export type FleetPlacementAssignment = {
  key: string;
  area: string;
  location: string;
  vehicleType: string;
  equipmentType: string;
  name: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber: string;
  vin: string;
  owner: string;
  updatedAt: string;
};

export type FleetPlacementExportRow = {
  index: number;
  vehicle: VehicleRow;
  assignment?: FleetPlacementAssignment;
};

export type FleetPlacementImportRow = Omit<FleetPlacementAssignment, "updatedAt">;

const fleetPlacementExportHeaders = [
  "Участок",
  "Местонахождение",
  "Вид техники",
  "Наименование техники",
  "Марка",
  "Модель",
  "Гос. номер",
  "Гар. номер",
  "VIN",
  "Собственник",
  "Ключ техники",
];

function normalizeIdentityPart(value: string | undefined) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function vehicleName(vehicle: VehicleRow) {
  return [vehicle.brand, vehicle.model].map((part) => part.trim()).filter(Boolean).join(" ") || vehicle.name;
}

export function createFleetPlacementKeyFromValues(values: {
  vin?: string;
  plateNumber?: string;
  garageNumber?: string;
  brand?: string;
  model?: string;
  equipmentType?: string;
  vehicleType?: string;
}) {
  const vin = normalizeIdentityPart(values.vin);
  const plateNumber = normalizeIdentityPart(values.plateNumber);
  const garageNumber = normalizeIdentityPart(values.garageNumber);
  const brand = normalizeIdentityPart(values.brand);
  const model = normalizeIdentityPart(values.model);
  const equipmentType = normalizeIdentityPart(values.equipmentType);
  const vehicleType = normalizeIdentityPart(values.vehicleType);

  if (vin) return `vin:${vin}`;
  if (plateNumber && garageNumber) return `plate-garage:${plateNumber}|${garageNumber}`;
  if (garageNumber) return `garage:${garageNumber}`;
  if (plateNumber) return `plate:${plateNumber}`;

  return `vehicle:${[vehicleType, equipmentType, brand, model].filter(Boolean).join("|")}`;
}

export function createFleetPlacementKey(vehicle: VehicleRow) {
  return createFleetPlacementKeyFromValues(vehicle);
}

export function createFleetPlacementAssignment(
  vehicle: VehicleRow,
  area: string,
  location: string,
  updatedAt: string,
): FleetPlacementAssignment {
  return {
    key: createFleetPlacementKey(vehicle),
    area,
    location,
    vehicleType: vehicle.vehicleType,
    equipmentType: vehicle.equipmentType,
    name: vehicleName(vehicle),
    brand: vehicle.brand,
    model: vehicle.model,
    plateNumber: vehicle.plateNumber,
    garageNumber: vehicle.garageNumber,
    vin: vehicle.vin,
    owner: vehicle.owner,
    updatedAt,
  };
}

export function createFleetPlacementExportRows(rows: FleetPlacementExportRow[]) {
  return [
    fleetPlacementExportHeaders,
    ...rows.map(({ vehicle, assignment }) => [
      assignment?.area ?? "",
      assignment?.location ?? "",
      vehicle.vehicleType,
      vehicle.equipmentType,
      vehicle.brand,
      vehicle.model,
      vehicle.plateNumber,
      vehicle.garageNumber,
      vehicle.vin,
      vehicle.owner,
      createFleetPlacementKey(vehicle),
    ]),
  ];
}

export async function downloadFleetPlacementRowsToExcel(rows: FleetPlacementExportRow[]) {
  const { createXlsxBlob } = await import("@/lib/utils/xlsx");
  const blob = createXlsxBlob(createFleetPlacementExportRows(rows), "Расстановка");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "rasstanovka-tehniki.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cell(row: string[], column: number) {
  return column >= 0 ? row[column]?.trim() ?? "" : "";
}

export async function parseFleetPlacementImportFile(file: File) {
  const [headers = [], ...rows] = (await parseTableImportFile(file)).filter((row) => row.some((item) => item.trim()));
  if (!headers.length) return [];

  const columns = {
    area: findTableColumn(headers, ["Участок"]),
    location: findTableColumn(headers, ["Местонахождение", "Локация"]),
    vehicleType: findTableColumn(headers, ["Вид техники", "Категория техники"]),
    equipmentType: findTableColumn(headers, ["Наименование техники", "Тип техники", "Наименование"]),
    brand: findTableColumn(headers, ["Марка"]),
    model: findTableColumn(headers, ["Модель"]),
    plateNumber: findTableColumn(headers, ["Гос. номер", "Госномер", "Гос номер"]),
    garageNumber: findTableColumn(headers, ["Гар. номер", "Гарномер", "Гаражный номер"]),
    vin: findTableColumn(headers, ["VIN"]),
    owner: findTableColumn(headers, ["Собственник"]),
    key: findTableColumn(headers, ["Ключ техники"]),
  };

  return rows
    .map((row): FleetPlacementImportRow | null => {
      const plateNumber = cell(row, columns.plateNumber);
      const garageNumber = cell(row, columns.garageNumber);
      const vin = cell(row, columns.vin);
      const brand = cell(row, columns.brand);
      const model = cell(row, columns.model);
      const equipmentType = cell(row, columns.equipmentType);
      const vehicleType = cell(row, columns.vehicleType);
      const importedKey = cell(row, columns.key);
      const key = importedKey || createFleetPlacementKeyFromValues({
        vin,
        plateNumber,
        garageNumber,
        brand,
        model,
        equipmentType,
        vehicleType,
      });

      if (!key || key === "vehicle:") return null;

      return {
        key,
        area: cell(row, columns.area),
        location: cell(row, columns.location),
        vehicleType,
        equipmentType,
        name: [brand, model].filter(Boolean).join(" "),
        brand,
        model,
        plateNumber,
        garageNumber,
        vin,
        owner: cell(row, columns.owner),
      };
    })
    .filter((row): row is FleetPlacementImportRow => row !== null);
}
