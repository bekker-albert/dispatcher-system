import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type FleetVehicleStatus = "В работе" | "В ремонте" | "В простое";

export type FleetVehicleListRow = {
  id: number;
  index: number;
  area: string;
  location: string;
  equipmentType: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber: string;
  firstWatchFirstShiftDriver: string;
  firstWatchSecondShiftDriver: string;
  secondWatchFirstShiftDriver: string;
  secondWatchSecondShiftDriver: string;
  status: FleetVehicleStatus;
  repairStartedAt: string;
  note: string;
};

export function deriveFleetVehicleStatus(vehicle: VehicleRow): FleetVehicleStatus {
  if (vehicle.repair > 0) return "В ремонте";
  if (vehicle.downtime > 0 || vehicle.active === false) return "В простое";

  return "В работе";
}

export function createFleetVehicleListRows(vehicleRows: VehicleRow[]): FleetVehicleListRow[] {
  return vehicleRows
    .filter((vehicle) => vehicle.visible !== false)
    .map((vehicle, index) => ({
      id: vehicle.id,
      index: index + 1,
      area: vehicle.area,
      location: vehicle.location,
      equipmentType: vehicle.equipmentType,
      brand: vehicle.brand,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      garageNumber: vehicle.garageNumber,
      firstWatchFirstShiftDriver: "",
      firstWatchSecondShiftDriver: "",
      secondWatchFirstShiftDriver: "",
      secondWatchSecondShiftDriver: "",
      status: deriveFleetVehicleStatus(vehicle),
      repairStartedAt: "",
      note: "",
    }));
}
