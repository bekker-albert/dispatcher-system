import { adminVehicleFilterSearchStyle } from "./AdminVehicleFilterStyles";
import type { AdminVehicleFilterHeaderProps } from "./AdminVehicleFilterTypes";

type AdminVehicleFilterSearchProps = Pick<AdminVehicleFilterHeaderProps, "search" | "onSearchChange"> & {
  label: string;
};

export function AdminVehicleFilterSearch({
  label,
  search,
  onSearchChange,
}: AdminVehicleFilterSearchProps) {
  return (
    <input
      aria-label={`Поиск в фильтре ${label}`}
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Поиск..."
      style={adminVehicleFilterSearchStyle}
    />
  );
}
