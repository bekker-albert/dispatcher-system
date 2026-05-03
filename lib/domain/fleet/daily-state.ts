import type { VehicleRow } from "@/lib/domain/vehicles/types";

export type FleetOperationalStatus = "В работе" | "В ремонте" | "В простое";

export type FleetDriverShiftSlot =
  | "watch1Shift1"
  | "watch1Shift2"
  | "watch2Shift1"
  | "watch2Shift2";

export type FleetDriverAssignment = {
  driverId: string;
  driverName: string;
};

export type FleetDriverAssignments = Partial<Record<FleetDriverShiftSlot, FleetDriverAssignment>>;

export type FleetDailyState = {
  vehicleId: number;
  workDate: string;
  status: FleetOperationalStatus;
  repairStartedAt: string;
  repairReason: string;
  note: string;
  driverAssignments: FleetDriverAssignments;
};

export const fleetOperationalStatuses: FleetOperationalStatus[] = ["В работе", "В ремонте", "В простое"];

export const fleetDriverShiftSlots: Array<{ key: FleetDriverShiftSlot; label: string }> = [
  { key: "watch1Shift1", label: "1 вахта / 1 смена" },
  { key: "watch1Shift2", label: "1 вахта / 2 смена" },
  { key: "watch2Shift1", label: "2 вахта / 1 смена" },
  { key: "watch2Shift2", label: "2 вахта / 2 смена" },
];

export function deriveFleetOperationalStatus(vehicle: Pick<VehicleRow, "active" | "repair" | "downtime">): FleetOperationalStatus {
  if (vehicle.repair > 0) return "В ремонте";
  if (vehicle.downtime > 0 || vehicle.active === false) return "В простое";

  return "В работе";
}

export function fleetDailyStateKey(vehicleId: number, workDate: string) {
  return `${vehicleId}:${workDate}`;
}

export function isFleetWorkDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function createDefaultFleetDailyState(vehicle: VehicleRow, workDate: string): FleetDailyState {
  return {
    vehicleId: vehicle.id,
    workDate,
    status: deriveFleetOperationalStatus(vehicle),
    repairStartedAt: "",
    repairReason: "",
    note: "",
    driverAssignments: {},
  };
}

export function normalizeFleetDailyState(value: unknown): FleetDailyState | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const vehicleId = Number(record.vehicleId);
  const workDate = record.workDate;
  const status = fleetOperationalStatuses.find((option) => option === record.status) ?? "В работе";

  if (!Number.isFinite(vehicleId) || !isFleetWorkDate(workDate)) return null;

  return {
    vehicleId,
    workDate,
    status,
    repairStartedAt: typeof record.repairStartedAt === "string" ? record.repairStartedAt : "",
    repairReason: typeof record.repairReason === "string" ? record.repairReason : "",
    note: typeof record.note === "string" ? record.note : "",
    driverAssignments: normalizeFleetDriverAssignments(record.driverAssignments),
  };
}

export function normalizeFleetDailyStates(value: unknown): FleetDailyState[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeFleetDailyState(item))
    .filter((item): item is FleetDailyState => item !== null);
}

export function findFleetDailyState(
  states: readonly FleetDailyState[],
  vehicleId: number,
  workDate: string,
) {
  return states.find((state) => state.vehicleId === vehicleId && state.workDate === workDate) ?? null;
}

export function resolveFleetDailyState(
  vehicle: VehicleRow,
  states: readonly FleetDailyState[],
  workDate: string,
) {
  return findFleetDailyState(states, vehicle.id, workDate) ?? createDefaultFleetDailyState(vehicle, workDate);
}

export function upsertFleetDailyState(
  states: readonly FleetDailyState[],
  nextState: FleetDailyState,
) {
  const nextKey = fleetDailyStateKey(nextState.vehicleId, nextState.workDate);
  let replaced = false;
  const nextStates = states.map((state) => {
    if (fleetDailyStateKey(state.vehicleId, state.workDate) !== nextKey) return state;

    replaced = true;
    return nextState;
  });

  return replaced ? nextStates : [...nextStates, nextState];
}

function normalizeFleetDriverAssignments(value: unknown): FleetDriverAssignments {
  if (!value || typeof value !== "object") return {};

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    fleetDriverShiftSlots.flatMap(({ key }) => {
      const assignment = normalizeFleetDriverAssignment(record[key]);
      return assignment ? [[key, assignment] as const] : [];
    }),
  );
}

function normalizeFleetDriverAssignment(value: unknown): FleetDriverAssignment | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const driverId = typeof record.driverId === "string" ? record.driverId : "";
  const driverName = typeof record.driverName === "string" ? record.driverName : "";

  return driverId || driverName ? { driverId, driverName } : null;
}
