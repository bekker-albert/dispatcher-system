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
  | "fuelCardNumber"
  | "gpsInstalled"
  | "dutInstalled"
  | "canInstalled"
  | "mainMileageSource"
  | "mainFuelSource"
  | "mainEngineHoursSource"
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
  | "fuelCardNumber"
  | "gpsInstalled"
  | "dutInstalled"
  | "canInstalled"
  | "mainMileageSource"
  | "mainFuelSource"
  | "mainEngineHoursSource"
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
  "fuelCardNumber",
  "gpsInstalled",
  "dutInstalled",
  "canInstalled",
  "mainMileageSource",
  "mainFuelSource",
  "mainEngineHoursSource",
  "manufactureYear",
  "vin",
  "owner",
];

export const vehicleAutocompleteFilterKeys: VehicleFilterKey[] = [
  "vehicleType",
  "equipmentType",
  "brand",
  "owner",
  "gpsInstalled",
  "dutInstalled",
  "canInstalled",
  "mainMileageSource",
  "mainFuelSource",
  "mainEngineHoursSource",
];

export const vehicleFilterColumnConfigs: VehicleFilterColumnConfig[] = [
  { key: "visible", label: "Показ", getValue: (vehicle) => (vehicle.visible === false ? "Скрыта" : "Показана") },
  { key: "vehicleType", label: "Вид техники", getValue: (vehicle) => vehicle.vehicleType },
  { key: "equipmentType", label: "Наименование техники", getValue: (vehicle) => vehicle.equipmentType },
  { key: "brand", label: "Марка", getValue: (vehicle) => vehicle.brand },
  { key: "model", label: "Модель", getValue: (vehicle) => vehicle.model },
  { key: "plateNumber", label: "Госномер", getValue: (vehicle) => vehicle.plateNumber },
  { key: "garageNumber", label: "Гарномер", getValue: (vehicle) => vehicle.garageNumber },
  { key: "fuelCardNumber", label: "№ топл.карты", getValue: (vehicle) => vehicle.fuelCardNumber ?? "" },
  { key: "gpsInstalled", label: "GPS", getValue: (vehicle) => vehicle.gpsInstalled ?? "" },
  { key: "dutInstalled", label: "ДУТ", getValue: (vehicle) => vehicle.dutInstalled ?? "" },
  { key: "canInstalled", label: "CAN", getValue: (vehicle) => vehicle.canInstalled ?? "" },
  { key: "mainMileageSource", label: "Источник пробега", getValue: (vehicle) => vehicle.mainMileageSource ?? "" },
  { key: "mainFuelSource", label: "Источник топлива", getValue: (vehicle) => vehicle.mainFuelSource ?? "" },
  { key: "mainEngineHoursSource", label: "Источник м/ч", getValue: (vehicle) => vehicle.mainEngineHoursSource ?? "" },
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
