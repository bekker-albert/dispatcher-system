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
        area: vehicle.area,
        location: vehicle.location,
        equipmentType: vehicle.equipmentType,
        brand: vehicle.brand,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        garageNumber: vehicle.garageNumber,
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
