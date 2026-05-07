export type FleetVehicleRowsViewport = {
  height: number;
  scrollTop: number;
};

export type FleetVehicleVirtualRows<T> = {
  bottomSpacerHeight: number;
  rows: T[];
  topSpacerHeight: number;
};

export const fleetVehicleVirtualRowHeight = 34;
export const fleetVehicleVirtualOverscanRows = 10;
export const fleetVehicleVirtualizationThreshold = 80;
export const fleetVehicleVirtualVariableTextThreshold = 48;

export function shouldDisableFleetVehicleVirtualizationForRows<T>(
  rows: readonly T[],
  getTextValues: (row: T) => readonly unknown[],
) {
  return rows.some((row) => getTextValues(row).some((value) => {
    if (typeof value !== "string") return false;
    return value.includes("\n") || value.length > fleetVehicleVirtualVariableTextThreshold;
  }));
}

export function createFleetVehicleVirtualRows<T>(
  rows: T[],
  viewport: FleetVehicleRowsViewport,
  enabled: boolean,
): FleetVehicleVirtualRows<T> {
  if (!enabled || rows.length <= fleetVehicleVirtualizationThreshold) {
    return {
      bottomSpacerHeight: 0,
      rows,
      topSpacerHeight: 0,
    };
  }

  const start = Math.max(
    0,
    Math.floor(viewport.scrollTop / fleetVehicleVirtualRowHeight) - fleetVehicleVirtualOverscanRows,
  );
  const visibleCount = Math.ceil(viewport.height / fleetVehicleVirtualRowHeight) + fleetVehicleVirtualOverscanRows * 2;
  const end = Math.min(rows.length, start + visibleCount);

  return {
    bottomSpacerHeight: Math.max(0, rows.length - end) * fleetVehicleVirtualRowHeight,
    rows: rows.slice(start, end),
    topSpacerHeight: start * fleetVehicleVirtualRowHeight,
  };
}
