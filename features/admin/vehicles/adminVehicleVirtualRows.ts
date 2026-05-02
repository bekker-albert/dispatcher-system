import {
  adminVehicleVirtualOverscanRows,
  adminVehicleVirtualRowHeight,
  adminVehicleVirtualizationThreshold,
} from "./adminVehicleTableStyles";

export type AdminVehicleRowsViewport = {
  height: number;
  scrollTop: number;
};

export type AdminVehicleVirtualRows<T> = {
  rows: T[];
  topSpacerHeight: number;
  bottomSpacerHeight: number;
};

export function createAdminVehicleVirtualRows<T>(
  rows: T[],
  viewport: AdminVehicleRowsViewport,
  enabled: boolean,
): AdminVehicleVirtualRows<T> {
  if (!enabled || rows.length <= adminVehicleVirtualizationThreshold) {
    return {
      rows,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
    };
  }

  const start = Math.max(0, Math.floor(viewport.scrollTop / adminVehicleVirtualRowHeight) - adminVehicleVirtualOverscanRows);
  const visibleCount = Math.ceil(viewport.height / adminVehicleVirtualRowHeight) + adminVehicleVirtualOverscanRows * 2;
  const end = Math.min(rows.length, start + visibleCount);

  return {
    rows: rows.slice(start, end),
    topSpacerHeight: start * adminVehicleVirtualRowHeight,
    bottomSpacerHeight: Math.max(0, rows.length - end) * adminVehicleVirtualRowHeight,
  };
}
