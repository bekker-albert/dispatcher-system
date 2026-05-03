import type { VehicleRow } from "./types";

type VehicleFilterColumnLike = {
  key: string;
  getValue: (vehicle: VehicleRow) => string;
};

type VehicleFiltersLike = Partial<Record<string, string[]>>;
type VehicleFilterSetsLike = Partial<Record<string, Set<string>>>;

export type VehicleFilterSets = VehicleFilterSetsLike;

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

export function createVehicleFilterOptionsByKey(
  rows: VehicleRow[],
  columns: VehicleFilterColumnLike[],
  keys: readonly string[],
) {
  const keySet = new Set(keys);
  const optionSets = new Map<string, Set<string>>();
  const targetColumns = columns.filter((column) => {
    if (!keySet.has(column.key)) return false;

    optionSets.set(column.key, new Set());
    return true;
  });

  rows.forEach((vehicle) => {
    targetColumns.forEach((column) => {
      optionSets.get(column.key)?.add(vehicleFilterOptionValue(column.getValue(vehicle)));
    });
  });

  return Object.fromEntries(
    targetColumns.map((column) => [
      column.key,
      Array.from(optionSets.get(column.key) ?? [])
        .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru")),
    ]),
  ) as Partial<Record<string, string[]>>;
}

export function mergeVehicleFilterOptions(options: string[], selectedValues: string[] = []) {
  return Array.from(new Set([...options, ...selectedValues.map(vehicleFilterOptionValue)]))
    .sort((a, b) => vehicleFilterOptionLabel(a).localeCompare(vehicleFilterOptionLabel(b), "ru"));
}

export function createVehicleFilterSets(filters: VehicleFiltersLike) {
  return Object.fromEntries(
    Object.entries(filters).flatMap(([key, values]) => (
      values === undefined ? [] : [[key, new Set(values.map(vehicleFilterOptionValue))] as const]
    )),
  ) as VehicleFilterSetsLike;
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

export function vehicleMatchesFilterSets(
  vehicle: VehicleRow,
  filterSets: VehicleFilterSetsLike,
  columns: VehicleFilterColumnLike[],
  excludedKey?: string,
) {
  return columns.every((column) => {
    if (column.key === excludedKey) return true;

    const selectedValues = filterSets[column.key];
    if (selectedValues === undefined) return true;

    return selectedValues.has(vehicleFilterOptionValue(column.getValue(vehicle)));
  });
}

export function createVehicleFilterOptionsForKey(
  rows: VehicleRow[],
  columns: VehicleFilterColumnLike[],
  filterSets: VehicleFilterSetsLike,
  key: string,
  selectedValues: string[] = [],
) {
  const column = columns.find((item) => item.key === key);
  if (!column) return [];

  const rowsForColumn = rows.filter((vehicle) => vehicleMatchesFilterSets(vehicle, filterSets, columns, key));
  return mergeVehicleFilterOptions(createVehicleFilterOptions(rowsForColumn, column), selectedValues);
}

export function cloneVehicleRows(rows: VehicleRow[]) {
  return rows.map((vehicle) => ({ ...vehicle }));
}
