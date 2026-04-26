import {
  createDefaultVehicles,
  createVehicleSeedVersion,
  type VehicleSeedRow,
} from "../../../../lib/domain/vehicles/defaults";

export async function loadDefaultVehicleSeed() {
  const seedModule = await import("../../../../data/default-vehicles.json");
  const seedRows = seedModule.default as VehicleSeedRow[];

  return {
    rows: seedRows,
    version: createVehicleSeedVersion(seedRows),
    vehicles: createDefaultVehicles(seedRows),
  };
}
