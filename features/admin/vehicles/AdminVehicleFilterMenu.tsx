import { vehicleFilterOptionLabel } from "@/lib/domain/vehicles/filtering";
import { normalizeLookupValue } from "@/lib/utils/text";

import { AdminVehicleFilterSearch } from "./AdminVehicleFilterSearch";
import {
  adminVehicleFilterActionsStyle,
  adminVehicleFilterEmptyStyle,
  adminVehicleFilterLinkButtonStyle,
  adminVehicleFilterMenuStyle,
  adminVehicleFilterMenuTitleStyle,
  adminVehicleFilterOptionsStyle,
  adminVehicleFilterOptionStyle,
} from "./AdminVehicleFilterStyles";
import type { AdminVehicleFilterHeaderProps } from "./AdminVehicleFilterTypes";

type AdminVehicleFilterMenuProps = Pick<
  AdminVehicleFilterHeaderProps,
  | "options"
  | "draftSelectedValues"
  | "search"
  | "onSearchChange"
  | "onToggleValue"
  | "onSelectAll"
  | "onDeselectAll"
  | "onApply"
  | "onClose"
> & {
  label: string;
};

export function AdminVehicleFilterMenu({
  label,
  options,
  draftSelectedValues,
  search,
  onSearchChange,
  onToggleValue,
  onSelectAll,
  onDeselectAll,
  onApply,
  onClose,
}: AdminVehicleFilterMenuProps) {
  const normalizedSearch = normalizeLookupValue(search);
  const visibleOptions = options.filter((option) => (
    !normalizedSearch || normalizeLookupValue(vehicleFilterOptionLabel(option)).includes(normalizedSearch)
  ));
  const selectedSet = new Set(draftSelectedValues ?? []);
  const isDraftActive = draftSelectedValues !== undefined;

  return (
    <div
      style={adminVehicleFilterMenuStyle}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div style={adminVehicleFilterMenuTitleStyle}>{label}</div>
      <AdminVehicleFilterSearch label={label} search={search} onSearchChange={onSearchChange} />
      <div style={adminVehicleFilterActionsStyle}>
        <button onClick={onSelectAll} style={adminVehicleFilterLinkButtonStyle} type="button">Выбрать все</button>
        <button onClick={onDeselectAll} style={adminVehicleFilterLinkButtonStyle} type="button">Снять все</button>
        <button onClick={onApply} style={adminVehicleFilterLinkButtonStyle} type="button">Применить</button>
      </div>
      <div style={adminVehicleFilterOptionsStyle}>
        {visibleOptions.length ? visibleOptions.map((option) => (
          <label key={option || "__empty"} style={adminVehicleFilterOptionStyle}>
            <input
              checked={!isDraftActive || selectedSet.has(option)}
              onChange={() => onToggleValue(option)}
              type="checkbox"
            />
            <span title={vehicleFilterOptionLabel(option)}>{vehicleFilterOptionLabel(option)}</span>
          </label>
        )) : (
          <div style={adminVehicleFilterEmptyStyle}>Нет значений</div>
        )}
      </div>
    </div>
  );
}
