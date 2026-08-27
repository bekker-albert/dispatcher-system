import type { VehicleRow } from "@/lib/domain/vehicles/types";

export function buildDispatchVehicleLabel(vehicle: VehicleRow) {
  const brandModel = [vehicle.brand.trim(), vehicle.model.trim()].filter(Boolean).join(" ");

  return brandModel
    || vehicle.equipmentType.trim()
    || vehicle.vehicleType.trim()
    || vehicle.name.trim()
    || "Техника";
}
