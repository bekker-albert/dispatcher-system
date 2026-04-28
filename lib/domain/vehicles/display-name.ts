import type { VehicleRow } from "./types";

export function buildVehicleDisplayName(vehicle: Pick<VehicleRow, "name" | "brand" | "model" | "garageNumber" | "plateNumber">) {
  const title = [vehicle.brand, vehicle.model].map((value) => value.trim()).filter(Boolean).join(" ");
  const garageNumber = vehicle.garageNumber.trim();
  const plateNumber = vehicle.plateNumber.trim();
  const numberBlock = garageNumber && plateNumber
    ? `${garageNumber}(${plateNumber})`
    : garageNumber || (plateNumber ? `(${plateNumber})` : "");

  return [title, numberBlock].filter(Boolean).join(" - ") || vehicle.name.trim() || "Без названия";
}
