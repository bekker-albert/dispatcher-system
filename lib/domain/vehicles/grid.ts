import type { VehicleRow } from "./types";

export const adminVehicleFallbackPreviewRows = 17;
export const adminVehicleMinPreviewRows = 3;
export const adminVehicleViewportBottomReserve = 64;

export type VehicleFilterKey =
  | "visible"
  | "vehicleType"
  | "equipmentType"
  | "brand"
  | "model"
  | "plateNumber"
  | "garageNumber"
  | "manufactureYear"
  | "vin"
  | "owner";

export type VehicleFilters = Partial<Record<VehicleFilterKey, string[]>>;

export type VehicleFilterColumnConfig = {
  key: VehicleFilterKey;
  label: string;
  getValue: (vehicle: VehicleRow) => string;
};

export type VehicleInlineField =
  | "vehicleType"
  | "equipmentType"
  | "brand"
  | "model"
  | "plateNumber"
  | "garageNumber"
  | "manufactureYear"
  | "vin"
  | "owner";

export const vehicleInlineFields: VehicleInlineField[] = [
  "vehicleType",
  "equipmentType",
  "brand",
  "model",
  "plateNumber",
  "garageNumber",
  "manufactureYear",
  "vin",
  "owner",
];

export const vehicleAutocompleteFilterKeys: VehicleFilterKey[] = ["vehicleType", "equipmentType", "brand", "owner"];

export const vehicleFilterColumnConfigs: VehicleFilterColumnConfig[] = [
  { key: "visible", label: "Показ", getValue: (vehicle) => (vehicle.visible === false ? "Скрыта" : "Показана") },
  { key: "vehicleType", label: "Категория техники", getValue: (vehicle) => vehicle.vehicleType },
  { key: "equipmentType", label: "Тип техники", getValue: (vehicle) => vehicle.equipmentType },
  { key: "brand", label: "Марка", getValue: (vehicle) => vehicle.brand },
  { key: "model", label: "Модель", getValue: (vehicle) => vehicle.model },
  { key: "plateNumber", label: "Госномер", getValue: (vehicle) => vehicle.plateNumber },
  { key: "garageNumber", label: "Гарномер", getValue: (vehicle) => vehicle.garageNumber },
  { key: "manufactureYear", label: "Год выпуска", getValue: (vehicle) => vehicle.manufactureYear },
  { key: "vin", label: "VIN", getValue: (vehicle) => vehicle.vin },
  { key: "owner", label: "Собственник", getValue: (vehicle) => vehicle.owner },
];

export function vehicleInlineFieldDomKey(vehicleId: number, field: VehicleInlineField) {
  return `${vehicleId}:${field}`;
}

export function parseVehicleInlineFieldDomKey(key: string) {
  const [vehicleIdValue, fieldValue] = key.split(":");
  const vehicleId = Number(vehicleIdValue);
  const field = vehicleInlineFields.find((inlineField) => inlineField === fieldValue);

  if (!Number.isFinite(vehicleId) || !field) return null;
  return { vehicleId, field };
}

export function vehicleFieldIsNumeric(field: VehicleInlineField) {
  return field === "manufactureYear";
}
