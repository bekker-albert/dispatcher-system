import { normalizeVehicleRow } from "./defaults";
import type { VehicleRow } from "./types";

export type VehicleRowsPatchItem = {
  row: VehicleRow;
  sortIndex: number;
};

export type VehicleRowsSavePlan =
  | {
    kind: "none";
  }
  | {
    kind: "patch";
    patchRows: VehicleRowsPatchItem[];
    expectedSnapshot: VehicleRow[];
  }
  | {
    kind: "replace";
    rows: VehicleRow[];
    expectedSnapshot: VehicleRow[] | null;
  };

function normalizedVehicleKey(vehicle: VehicleRow) {
  return JSON.stringify(normalizeVehicleRow(vehicle));
}

export function shouldBlockVehicleRowsAutoSave(snapshot: string, blockedSnapshot: string) {
  return blockedSnapshot.length > 0 && snapshot === blockedSnapshot;
}

function hasSameVehicleOrder(currentRows: VehicleRow[], expectedRows: VehicleRow[]) {
  return currentRows.length === expectedRows.length
    && currentRows.every((vehicle, index) => vehicle.id === expectedRows[index]?.id);
}

export function createVehicleRowsSavePlan(
  currentRows: VehicleRow[],
  expectedSnapshot: VehicleRow[] | null,
): VehicleRowsSavePlan {
  if (!expectedSnapshot || !hasSameVehicleOrder(currentRows, expectedSnapshot)) {
    return {
      kind: "replace",
      rows: currentRows,
      expectedSnapshot,
    };
  }

  const expectedKeysById = new Map(expectedSnapshot.map((vehicle) => [vehicle.id, normalizedVehicleKey(vehicle)]));
  const patchRows = currentRows
    .map((row, sortIndex) => ({ row, sortIndex }))
    .filter(({ row }) => normalizedVehicleKey(row) !== expectedKeysById.get(row.id));

  return patchRows.length > 0
    ? {
      kind: "patch",
      patchRows,
      expectedSnapshot,
    }
    : { kind: "none" };
}
