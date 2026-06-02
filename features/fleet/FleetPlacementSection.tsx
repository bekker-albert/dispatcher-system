"use client";

import { Download, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent } from "react";

import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { IconButton } from "@/shared/ui/buttons";
import { SectionCard } from "@/shared/ui/layout";
import {
  createFleetPlacementAssignment,
  createFleetPlacementKey,
  downloadFleetPlacementRowsToExcel,
  fleetPlacementStorageKey,
  parseFleetPlacementImportFile,
  type FleetPlacementAssignment,
} from "./fleetPlacementExcel";

type FleetPlacementSectionProps = {
  vehicleRows: VehicleRow[];
  ptoPlanRows: PtoPlanRow[];
  workDate: string;
};

const shellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minHeight: "calc(100dvh - 132px)",
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const toolbarActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const summaryStyle: CSSProperties = {
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
};

const editButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  padding: "8px 12px",
};

const tableWrapStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  flex: "1 1 auto",
  minHeight: 0,
  maxHeight: "calc(100dvh - 178px)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: 1060,
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: CSSProperties = {
  padding: "8px 9px",
  border: "1px solid #cbd5e1",
  background: "#f1f5f9",
  color: "#0f172a",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "nowrap",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle: CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #e2e8f0",
  color: "#334155",
  verticalAlign: "top",
};

const selectStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  background: "#ffffff",
  color: "#0f172a",
  font: "inherit",
  padding: "6px 7px",
};

const warningStyle: CSSProperties = {
  border: "1px solid #fde68a",
  borderRadius: 8,
  background: "#fffbeb",
  color: "#92400e",
  fontSize: 12,
  fontWeight: 700,
  padding: "8px 10px",
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right, "ru"));
}

function vehicleName(vehicle: VehicleRow) {
  return [vehicle.brand, vehicle.model].map((part) => part.trim()).filter(Boolean).join(" ") || vehicle.name;
}

function vehicleStatus(vehicle: VehicleRow) {
  if (vehicle.repair > 0) return "Ремонт";
  if (vehicle.downtime > 0) return "Простой";
  if (vehicle.work > 0 || vehicle.trips > 0) return "В работе";
  if (vehicle.rent > 0) return "Аренда";
  return vehicle.active ? "Активна" : "Неактивна";
}

function createLocationOptionsByArea(ptoPlanRows: PtoPlanRow[]) {
  const locationsByArea = new Map<string, string[]>();

  ptoPlanRows.forEach((row) => {
    const area = row.area.trim();
    const location = row.location.trim();
    if (!area || !location) return;

    locationsByArea.set(area, uniqueSorted([...(locationsByArea.get(area) ?? []), location]));
  });

  return locationsByArea;
}

export function FleetPlacementSection({
  vehicleRows,
  ptoPlanRows,
  workDate,
}: FleetPlacementSectionProps) {
  const [editing, setEditing] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [placementAssignments, setPlacementAssignments] = useState<Record<string, FleetPlacementAssignment>>({});
  const placementImportInputRef = useRef<HTMLInputElement | null>(null);
  const rows = useMemo(() => vehicleRows.filter((vehicle) => vehicle.visible !== false), [vehicleRows]);
  const areaOptions = useMemo(() => uniqueSorted(ptoPlanRows.map((row) => row.area)), [ptoPlanRows]);
  const locationsByArea = useMemo(() => createLocationOptionsByArea(ptoPlanRows), [ptoPlanRows]);
  const ptoPlanHasPlacementOptions = areaOptions.length > 0;
  const currentVehicleKeys = useMemo(() => new Set(rows.map(createFleetPlacementKey)), [rows]);
  const unmatchedAssignmentCount = useMemo(
    () => Object.keys(placementAssignments).filter((key) => !currentVehicleKeys.has(key)).length,
    [currentVehicleKeys, placementAssignments],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(fleetPlacementStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setPlacementAssignments(parsed as Record<string, FleetPlacementAssignment>);
      }
    } catch {
      setPlacementAssignments({});
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(fleetPlacementStorageKey, JSON.stringify(placementAssignments));
  }, [placementAssignments, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    setPlacementAssignments((current) => {
      if (Object.keys(current).length > 0) return current;

      const now = new Date().toISOString();
      const restoredFromLegacyRows = Object.fromEntries(
        vehicleRows
          .filter((vehicle) => vehicle.area || vehicle.location)
          .map((vehicle) => [
            createFleetPlacementKey(vehicle),
            createFleetPlacementAssignment(vehicle, vehicle.area, vehicle.location, now),
          ]),
      );

      return Object.keys(restoredFromLegacyRows).length > 0 ? restoredFromLegacyRows : current;
    });
  }, [storageReady, vehicleRows]);

  const getVehiclePlacement = (vehicle: VehicleRow) => {
    return placementAssignments[createFleetPlacementKey(vehicle)];
  };

  const updateVehiclePlacement = (vehicle: VehicleRow, area: string, location: string) => {
    setPlacementAssignments((current) => {
      const key = createFleetPlacementKey(vehicle);
      const next = { ...current };

      if (!area && !location) {
        delete next[key];
        return next;
      }

      next[key] = createFleetPlacementAssignment(vehicle, area, location, new Date().toISOString());
      return next;
    });
  };

  const updateVehicleArea = (vehicle: VehicleRow, area: string) => {
    const locationOptions = locationsByArea.get(area) ?? [];
    const currentLocation = getVehiclePlacement(vehicle)?.location ?? "";
    const nextLocation = locationOptions.includes(currentLocation) ? currentLocation : locationOptions[0] ?? "";
    updateVehiclePlacement(vehicle, area, nextLocation);
  };

  const exportPlacementToExcel = () => {
    void downloadFleetPlacementRowsToExcel(
      rows.map((vehicle, index) => ({
        index: index + 1,
        vehicle,
        assignment: getVehiclePlacement(vehicle),
      })),
    );
  };

  const importPlacementFromExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedRows = await parseFleetPlacementImportFile(file);
      const validAreas = new Set(areaOptions);
      let importedCount = 0;
      let skippedCount = 0;
      let preservedWithoutVehicleCount = 0;
      const updatedAt = new Date().toISOString();
      const nextAssignments = { ...placementAssignments };

      importedRows.forEach((row) => {
        const area = row.area.trim();
        const location = row.location.trim();
        const locationOptions = locationsByArea.get(area) ?? [];

        if (!area || !validAreas.has(area)) {
          skippedCount += 1;
          return;
        }

        if (location && locationOptions.length > 0 && !locationOptions.includes(location)) {
          skippedCount += 1;
          return;
        }

        nextAssignments[row.key] = { ...row, area, location, updatedAt };
        importedCount += 1;

        if (!currentVehicleKeys.has(row.key)) {
          preservedWithoutVehicleCount += 1;
        }
      });

      setPlacementAssignments(nextAssignments);

      window.alert(
        `Расстановка загружена: ${importedCount}. Пропущено: ${skippedCount}. Сохранено до появления техники в справочнике: ${preservedWithoutVehicleCount}.`,
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Не удалось прочитать Excel-файл расстановки.");
    } finally {
      event.target.value = "";
    }
  };

  const renderAreaCell = (vehicle: VehicleRow) => {
    const placement = getVehiclePlacement(vehicle);
    if (!editing) return placement?.area ?? "";

    return (
      <select
        style={selectStyle}
        value={placement?.area && areaOptions.includes(placement.area) ? placement.area : ""}
        onChange={(event) => updateVehicleArea(vehicle, event.target.value)}
      >
        <option value="">Выберите участок</option>
        {areaOptions.map((area) => (
          <option key={area} value={area}>{area}</option>
        ))}
      </select>
    );
  };

  const renderLocationCell = (vehicle: VehicleRow) => {
    const placement = getVehiclePlacement(vehicle);
    if (!editing) return placement?.location ?? "";

    const area = placement?.area ?? "";
    const locationOptions = locationsByArea.get(area) ?? [];

    return (
      <select
        style={selectStyle}
        value={placement?.location && locationOptions.includes(placement.location) ? placement.location : ""}
        onChange={(event) => updateVehiclePlacement(vehicle, area, event.target.value)}
        disabled={!area || locationOptions.length === 0}
      >
        <option value="">Выберите местонахождение</option>
        {locationOptions.map((location) => (
          <option key={location} value={location}>{location}</option>
        ))}
      </select>
    );
  };

  return (
    <SectionCard title="">
      <div style={shellStyle}>
        <div style={toolbarStyle}>
          <div style={summaryStyle}>
            {unmatchedAssignmentCount > 0 ? `Сохранено до появления техники в справочнике: ${unmatchedAssignmentCount}. ` : ""}
            Видимой техники: {rows.length}. Рабочая дата: {workDate}.
          </div>
          <div style={toolbarActionsStyle}>
            <IconButton label="Загрузить расстановку из Excel" onClick={() => placementImportInputRef.current?.click()}>
              <Upload size={16} aria-hidden />
            </IconButton>
            <input
              ref={placementImportInputRef}
              accept=".xlsx,.csv"
              onChange={importPlacementFromExcel}
              style={{ display: "none" }}
              type="file"
            />
            <IconButton label="Выгрузить расстановку в Excel" onClick={exportPlacementToExcel}>
              <Download size={16} aria-hidden />
            </IconButton>
          <button type="button" style={editButtonStyle} onClick={() => setEditing((current) => !current)}>
            {editing ? "Завершить редактирование" : "Редактировать"}
          </button>
          </div>
        </div>

        {!ptoPlanHasPlacementOptions ? (
          <div style={warningStyle}>
            {"В ПТО / План нет заполненных участков и местонахождений для расстановки."}
          </div>
        ) : null}

        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Участок</th>
                <th style={thStyle}>Местонахождение</th>
                <th style={thStyle}>Вид техники</th>
                <th style={thStyle}>Наименование техники</th>
                <th style={thStyle}>Гос. номер</th>
                <th style={thStyle}>Гар. номер</th>
                <th style={thStyle}>Статус</th>
                <th style={thStyle}>Дата/смена</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td style={tdStyle}>{renderAreaCell(vehicle)}</td>
                  <td style={tdStyle}>{renderLocationCell(vehicle)}</td>
                  <td style={tdStyle}>{vehicle.equipmentType || vehicle.vehicleType}</td>
                  <td style={tdStyle}>{vehicleName(vehicle)}</td>
                  <td style={tdStyle}>{vehicle.plateNumber}</td>
                  <td style={tdStyle}>{vehicle.garageNumber}</td>
                  <td style={tdStyle}>{vehicleStatus(vehicle)}</td>
                  <td style={tdStyle}>{workDate}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                    В справочнике нет видимой техники для расстановки.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
