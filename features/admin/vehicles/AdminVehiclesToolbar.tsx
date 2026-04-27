import { Check, Download, Pencil, Plus, RotateCcw } from "lucide-react";
import type { CSSProperties, ChangeEvent, RefObject } from "react";
import { IconButton } from "@/shared/ui/buttons";

export function AdminVehiclesToolbar({
  activeVehicleFilterCount,
  filteredVehicleRowsCount,
  totalVehicleRowsCount,
  adminVehiclesEditing,
  vehicleImportInputRef,
  onClearAllVehicleFilters,
  onStartEditing,
  onFinishEditing,
  onAddVehicleRow,
  onOpenVehicleImportFilePicker,
  onExportVehiclesToExcel,
  onImportVehiclesFromExcel,
}: {
  activeVehicleFilterCount: number;
  filteredVehicleRowsCount: number;
  totalVehicleRowsCount: number;
  adminVehiclesEditing: boolean;
  vehicleImportInputRef: RefObject<HTMLInputElement | null>;
  onClearAllVehicleFilters: () => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onAddVehicleRow: () => void;
  onOpenVehicleImportFilePicker: () => void;
  onExportVehiclesToExcel: () => void;
  onImportVehiclesFromExcel: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div style={adminVehicleToolbarStyle}>
      <div style={adminVehicleCounterStyle}>
        Техника: {activeVehicleFilterCount ? `${filteredVehicleRowsCount} из ${totalVehicleRowsCount}` : totalVehicleRowsCount}
        <span style={adminVehicleRenderedCountStyle}>{adminVehiclesEditing ? "редактирование" : "просмотр"}</span>
        {activeVehicleFilterCount ? (
          <button onClick={onClearAllVehicleFilters} style={adminVehicleClearFiltersStyle} type="button">
            Сбросить фильтры
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <IconButton label={adminVehiclesEditing ? "Сохранить редактирование" : "Редактировать список техники"} onClick={adminVehiclesEditing ? onFinishEditing : onStartEditing}>
          {adminVehiclesEditing ? <Check size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
        </IconButton>
        {adminVehiclesEditing ? (
          <>
            <IconButton label="Добавить технику" onClick={onAddVehicleRow}>
              <Plus size={16} aria-hidden />
            </IconButton>
            <IconButton label="Загрузить список из Excel" onClick={onOpenVehicleImportFilePicker}>
              <RotateCcw size={16} aria-hidden />
            </IconButton>
          </>
        ) : null}
        <IconButton label="Выгрузить список техники в Excel" onClick={onExportVehiclesToExcel}>
          <Download size={16} aria-hidden />
        </IconButton>
        <input
          ref={vehicleImportInputRef}
          accept=".xlsx,.csv"
          onChange={onImportVehiclesFromExcel}
          style={{ display: "none" }}
          type="file"
        />
      </div>
    </div>
  );
}

const adminVehicleToolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 8,
};

const adminVehicleCounterStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  fontWeight: 700,
};

const adminVehicleRenderedCountStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 11,
  fontWeight: 700,
};

const adminVehicleClearFiltersStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 11,
  fontWeight: 700,
  padding: "4px 7px",
};
