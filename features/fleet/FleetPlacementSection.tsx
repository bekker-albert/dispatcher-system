"use client";

import type { CSSProperties } from "react";

import type { VehicleRow } from "@/lib/domain/vehicles/types";
import { SectionCard } from "@/shared/ui/layout";

type FleetPlacementSectionProps = {
  vehicleRows: VehicleRow[];
  workDate: string;
};

const tableWrapStyle: CSSProperties = {
  overflow: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  background: "#ffffff",
  maxHeight: "calc(100dvh - 250px)",
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
};

const tdStyle: CSSProperties = {
  padding: "7px 9px",
  border: "1px solid #e2e8f0",
  color: "#334155",
  verticalAlign: "top",
};

const noteStyle: CSSProperties = {
  marginBottom: 10,
  border: "1px solid #d8dee8",
  borderRadius: 8,
  background: "#f8fafc",
  color: "#475569",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
  padding: "8px 10px",
};

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

export function FleetPlacementSection({ vehicleRows, workDate }: FleetPlacementSectionProps) {
  const rows = vehicleRows.filter((vehicle) => vehicle.visible !== false);

  return (
    <SectionCard title="">
      <div style={noteStyle}>
        Draft UI: расстановка техники показывает фактическое пребывание из текущего справочника. Это источник выбора техники для Горной сводки, но не новый backend workflow.
      </div>
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
              <th style={thStyle}>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((vehicle) => (
              <tr key={vehicle.id}>
                <td style={tdStyle}>{vehicle.area}</td>
                <td style={tdStyle}>{vehicle.location}</td>
                <td style={tdStyle}>{vehicle.equipmentType || vehicle.vehicleType}</td>
                <td style={tdStyle}>{vehicleName(vehicle)}</td>
                <td style={tdStyle}>{vehicle.plateNumber}</td>
                <td style={tdStyle}>{vehicle.garageNumber}</td>
                <td style={tdStyle}>{vehicleStatus(vehicle)}</td>
                <td style={tdStyle}>{workDate}</td>
                <td style={tdStyle}>{vehicle.excavator ? `Звено: ${vehicle.excavator}` : ""}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                  В справочнике нет видимой техники для draft-расстановки.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
