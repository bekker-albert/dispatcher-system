import { ChevronDown } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { vehicleFilterOptionLabel } from "@/lib/domain/vehicles/filtering";

type VehicleFilterColumnLike = {
  label: string;
  icon?: ReactNode;
};

function normalizeLookupValue(value: string) {
  return value
    .toLowerCase()
    .replace(/^уч[._\s-]*/, "")
    .replace(/[^a-zа-яё0-9]+/g, "");
}

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
}: {
  column: VehicleFilterColumnLike;
  options: string[];
  appliedSelectedValues?: string[];
  draftSelectedValues?: string[];
  search: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const normalizedSearch = normalizeLookupValue(search);
  const visibleOptions = options.filter((option) => (
    !normalizedSearch || normalizeLookupValue(vehicleFilterOptionLabel(option)).includes(normalizedSearch)
  ));
  const selectedSet = new Set(draftSelectedValues ?? []);
  const isDraftActive = draftSelectedValues !== undefined;
  const isActive = appliedSelectedValues !== undefined;
  const label = column.label;

  return (
    <div style={adminVehicleFilterHeaderStyle} onClick={(event) => event.stopPropagation()}>
      {column.icon ? <span style={adminVehicleHeaderIconStyle} title={label}>{column.icon}</span> : <span style={adminVehicleHeaderTextStyle}>{column.label}</span>}
      <button
        aria-label={`Фильтр: ${label}`}
        title={`Фильтр: ${label}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleOpen();
        }}
        style={{
          ...adminVehicleFilterButtonStyle,
          ...(isActive ? adminVehicleFilterButtonActiveStyle : null),
        }}
        type="button"
      >
        <ChevronDown size={12} aria-hidden />
      </button>

      {isOpen ? (
        <div
          style={adminVehicleFilterMenuStyle}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
        >
          <div style={adminVehicleFilterMenuTitleStyle}>{label}</div>
          <input
            aria-label={`Поиск в фильтре ${label}`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск..."
            style={adminVehicleFilterSearchStyle}
          />
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
      ) : null}
    </div>
  );
}

const adminVehicleFilterHeaderStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 4,
  minWidth: 0,
};

const adminVehicleHeaderTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "normal",
  overflowWrap: "normal",
  wordBreak: "normal",
  hyphens: "none",
  lineHeight: 1.15,
};

const adminVehicleHeaderIconStyle: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  color: "#0f172a",
  minWidth: 14,
};

const adminVehicleFilterButtonStyle: CSSProperties = {
  width: 20,
  height: 20,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 5,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  display: "inline-grid",
  placeItems: "center",
  flex: "0 0 auto",
  padding: 0,
};

const adminVehicleFilterButtonActiveStyle: CSSProperties = {
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const adminVehicleFilterMenuStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: "calc(100% + 5px)",
  width: 230,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  boxShadow: "0 12px 28px rgba(15,23,42,0.16)",
  color: "#0f172a",
  padding: 8,
  zIndex: 80,
};

const adminVehicleFilterMenuTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const adminVehicleFilterSearchStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  fontFamily: "inherit",
  fontSize: 12,
  outline: "none",
  padding: "6px 7px",
};

const adminVehicleFilterActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 7,
};

const adminVehicleFilterLinkButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 800,
  padding: 0,
};

const adminVehicleFilterOptionsStyle: CSSProperties = {
  display: "grid",
  gap: 4,
  maxHeight: 220,
  overflowY: "auto",
  marginTop: 8,
  paddingRight: 2,
};

const adminVehicleFilterOptionStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "16px minmax(0, 1fr)",
  alignItems: "center",
  gap: 6,
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.2,
  minHeight: 23,
  overflow: "hidden",
  padding: "3px 4px",
};

const adminVehicleFilterEmptyStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 12,
  padding: "8px 4px",
};
