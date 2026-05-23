import type { VehicleRow } from "@/lib/domain/vehicles/types";
import {
  deriveFleetOperationalStatus,
  resolveFleetDailyState,
  type FleetDailyState,
  type FleetDriverShiftSlot,
  type FleetOperationalStatus,
} from "../../lib/domain/fleet/daily-state";

export type FleetVehicleStatus = FleetOperationalStatus;

export type FleetVehicleListRow = {
  id: number;
  index: number;
  vehicleType: string;
  equipmentType: string;
  brand: string;
  model: string;
  plateNumber: string;
  garageNumber: string;
  fuelCardNumber: string;
  manufactureYear: string;
  vin: string;
  owner: string;
  firstWatchFirstShiftDriver: string;
  firstWatchSecondShiftDriver: string;
  secondWatchFirstShiftDriver: string;
  secondWatchSecondShiftDriver: string;
  status: FleetVehicleStatus;
  repairStartedAt: string;
  note: string;
};

export function deriveFleetVehicleStatus(vehicle: VehicleRow): FleetVehicleStatus {
  return deriveFleetOperationalStatus(vehicle);
}

type CreateFleetVehicleListRowsOptions = {
  dailyStates?: readonly FleetDailyState[];
  workDate?: string;
};

export function createFleetVehicleListRows(
  vehicleRows: VehicleRow[],
  options: CreateFleetVehicleListRowsOptions = {},
): FleetVehicleListRow[] {
  const { dailyStates = [], workDate = "" } = options;

  return vehicleRows
    .filter((vehicle) => vehicle.visible !== false)
    .map((vehicle, index) => {
      const dailyState = workDate
        ? resolveFleetDailyState(vehicle, dailyStates, workDate)
        : null;

      return {
        id: vehicle.id,
        index: index + 1,
        vehicleType: vehicle.vehicleType,
        equipmentType: vehicle.equipmentType,
        brand: vehicle.brand,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        garageNumber: vehicle.garageNumber,
        fuelCardNumber: vehicle.fuelCardNumber ?? "",
        manufactureYear: vehicle.manufactureYear,
        vin: vehicle.vin,
        owner: vehicle.owner,
        firstWatchFirstShiftDriver: driverAssignmentName(dailyState?.driverAssignments.watch1Shift1),
        firstWatchSecondShiftDriver: driverAssignmentName(dailyState?.driverAssignments.watch1Shift2),
        secondWatchFirstShiftDriver: driverAssignmentName(dailyState?.driverAssignments.watch2Shift1),
        secondWatchSecondShiftDriver: driverAssignmentName(dailyState?.driverAssignments.watch2Shift2),
        status: dailyState?.status ?? deriveFleetVehicleStatus(vehicle),
        repairStartedAt: dailyState?.repairStartedAt ?? "",
        note: dailyState ? fleetDailyStateNote(dailyState) : "",
      };
    });
}

function driverAssignmentName(assignment: FleetDailyState["driverAssignments"][FleetDriverShiftSlot]) {
  return assignment?.driverName ?? "";
}

function fleetDailyStateNote(state: FleetDailyState) {
  if (state.repairReason && state.note) return `${state.repairReason}; ${state.note}`;
  return state.repairReason || state.note;
}
