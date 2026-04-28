import { AdminVehicleFilterMenu } from "./AdminVehicleFilterMenu";
import { AdminVehicleFilterColumnLabel, AdminVehicleFilterToggleButton } from "./AdminVehicleFilterHeaderParts";
import { adminVehicleFilterHeaderStyle } from "./AdminVehicleFilterStyles";
import type { AdminVehicleFilterHeaderProps } from "./AdminVehicleFilterTypes";

export function AdminVehicleFilterHeader({
  column,
  options,
  appliedSelectedValues,
  draftSelectedValues,
  search,
  isOpen,
  onToggleOpen,
  onSearchChange,
  onToggleValue,
  onSelectAll,
  onDeselectAll,
  onApply,
  onClose,
}: AdminVehicleFilterHeaderProps) {
  const label = column.label;

  return (
    <div style={adminVehicleFilterHeaderStyle} onClick={(event) => event.stopPropagation()}>
      <AdminVehicleFilterColumnLabel column={column} label={label} />
      <AdminVehicleFilterToggleButton isActive={appliedSelectedValues !== undefined} label={label} onToggleOpen={onToggleOpen} />

      {isOpen ? (
        <AdminVehicleFilterMenu
          label={label}
          options={options}
          draftSelectedValues={draftSelectedValues}
          search={search}
          onSearchChange={onSearchChange}
          onToggleValue={onToggleValue}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onApply={onApply}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}
