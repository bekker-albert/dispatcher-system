import type { VehicleRow } from "./types";

type VehicleFilterColumnLike = {
  key: string;
  getValue: (vehicle: VehicleRow) => string;
};

type VehicleFiltersLike = Partial<Record<string, string[]>>;

export function vehicleFilterOptionLabel(value: string) {
  return value.trim() || "Пусто";
}

export function vehicleFilterOptionValue(value: string) {
  return value.trim();
}

export function createVehicleFilterOptions(rows: VehicleRow[], column: Pick<VehicleFilterColumnLike, "getValue">) {
  return Array.from(new Set(rows.map((vehicle) => vehicleFilterOptionValue(column.getValue(vehicle)))))
    .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
}

export function vehicleMatchesFilters(
  vehicle: VehicleRow,
  filters: VehicleFiltersLike,
  columns: VehicleFilterColumnLike[],
  excludedKey?: string,
) {
  return columns.every((column) => {
    if (column.key === excludedKey) return true;

    const selectedValues = filters[column.key];
    if (selectedValues === undefined) return true;

    return selectedValues.includes(vehicleFilterOptionValue(column.getValue(vehicle)));
  });
}

export function cloneVehicleRows(rows: VehicleRow[]) {
  return rows.map((vehicle) => ({ ...vehicle }));
}
