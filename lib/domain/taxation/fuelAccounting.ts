import type { FuelAccountingPeriod, FuelMovement } from "./service-contracts";

export type FuelAccountingPeriodKind = "first_half" | "second_half";

export type FuelAccountingPeriodDraft = {
  sectionId: string;
  periodStart: string;
  periodEnd: string;
  periodKind: FuelAccountingPeriodKind;
};

export type FuelTruckOpeningBalance = {
  periodId: string;
  fuelTruckVehicleId: string;
  fuelType: string;
  openingLiters: number;
};

export type FuelTruckActualBalance = {
  periodId: string;
  fuelTruckVehicleId: string;
  fuelType: string;
  actualClosingLiters: number;
};

export type FuelTruckBalanceRow = {
  id: string;
  periodId: string;
  fuelTruckVehicleId: string;
  fuelType: string;
  openingLiters: number;
  supplierReceiptLiters: number;
  vehicleIssueLiters: number;
  contractorTransferLiters: number;
  writeOffLiters: number;
  correctionLiters: number;
  calculatedClosingLiters: number;
  actualClosingLiters?: number;
  discrepancyLiters?: number;
};

export type FuelTruckBalanceSummary = {
  rowCount: number;
  openingLiters: number;
  supplierReceiptLiters: number;
  vehicleIssueLiters: number;
  contractorTransferLiters: number;
  writeOffLiters: number;
  correctionLiters: number;
  calculatedClosingLiters: number;
  actualClosingLiters: number;
  discrepancyLiters: number;
};

const fuelBalanceKey = (fuelTruckVehicleId: string, fuelType: string): string => (
  `${fuelTruckVehicleId}|${fuelType}`
);

const toIsoDate = (year: number, month: number, day: number): string => [
  year.toString().padStart(4, "0"),
  month.toString().padStart(2, "0"),
  day.toString().padStart(2, "0"),
].join("-");

const getLastDayOfMonth = (year: number, month: number): number => (
  new Date(Date.UTC(year, month, 0)).getUTCDate()
);

export const createFuelAccountingPeriodDraft = (
  sectionId: string,
  workDate: string,
): FuelAccountingPeriodDraft => {
  const year = Number(workDate.slice(0, 4));
  const month = Number(workDate.slice(5, 7));
  const day = Number(workDate.slice(8, 10));

  if (day <= 15) {
    return {
      sectionId,
      periodStart: toIsoDate(year, month, 1),
      periodEnd: toIsoDate(year, month, 15),
      periodKind: "first_half",
    };
  }

  return {
    sectionId,
    periodStart: toIsoDate(year, month, 16),
    periodEnd: toIsoDate(year, month, getLastDayOfMonth(year, month)),
    periodKind: "second_half",
  };
};

const createEmptyFuelTruckBalanceRow = (
  periodId: string,
  fuelTruckVehicleId: string,
  fuelType: string,
): FuelTruckBalanceRow => ({
  id: `${periodId}:${fuelTruckVehicleId}:${fuelType}`,
  periodId,
  fuelTruckVehicleId,
  fuelType,
  openingLiters: 0,
  supplierReceiptLiters: 0,
  vehicleIssueLiters: 0,
  contractorTransferLiters: 0,
  writeOffLiters: 0,
  correctionLiters: 0,
  calculatedClosingLiters: 0,
});

export const buildFuelTruckBalanceRows = (
  period: Pick<FuelAccountingPeriod, "id">,
  movements: readonly FuelMovement[],
  openingBalances: readonly FuelTruckOpeningBalance[],
  actualBalances: readonly FuelTruckActualBalance[] = [],
): FuelTruckBalanceRow[] => {
  const rowsByKey = new Map<string, FuelTruckBalanceRow>();

  const ensureRow = (fuelTruckVehicleId: string, fuelType: string): FuelTruckBalanceRow => {
    const key = fuelBalanceKey(fuelTruckVehicleId, fuelType);
    const current = rowsByKey.get(key);

    if (current) {
      return current;
    }

    const next = createEmptyFuelTruckBalanceRow(period.id, fuelTruckVehicleId, fuelType);
    rowsByKey.set(key, next);
    return next;
  };

  for (const balance of openingBalances.filter((item) => item.periodId === period.id)) {
    const row = ensureRow(balance.fuelTruckVehicleId, balance.fuelType);
    row.openingLiters += balance.openingLiters;
  }

  for (const movement of movements.filter((item) => item.periodId === period.id && item.fuelTruckVehicleId)) {
    const row = ensureRow(movement.fuelTruckVehicleId ?? "", movement.fuelType);

    if (movement.movementKind === "fuel_truck_receipt") {
      row.supplierReceiptLiters += movement.liters;
      continue;
    }

    if (movement.movementKind === "vehicle_issue") {
      row.vehicleIssueLiters += movement.liters;
      continue;
    }

    if (movement.movementKind === "contractor_transfer") {
      row.contractorTransferLiters += movement.liters;
      continue;
    }

    if (movement.movementKind === "write_off") {
      row.writeOffLiters += movement.liters;
      continue;
    }

    row.correctionLiters += movement.liters;
  }

  for (const balance of actualBalances.filter((item) => item.periodId === period.id)) {
    const row = ensureRow(balance.fuelTruckVehicleId, balance.fuelType);
    row.actualClosingLiters = balance.actualClosingLiters;
  }

  return [...rowsByKey.values()]
    .map((row) => {
      const calculatedClosingLiters = (
        row.openingLiters
        + row.supplierReceiptLiters
        + row.correctionLiters
        - row.vehicleIssueLiters
        - row.contractorTransferLiters
        - row.writeOffLiters
      );

      return {
        ...row,
        calculatedClosingLiters,
        discrepancyLiters: row.actualClosingLiters === undefined
          ? undefined
          : row.actualClosingLiters - calculatedClosingLiters,
      };
    })
    .sort((left, right) => (
      left.fuelTruckVehicleId.localeCompare(right.fuelTruckVehicleId)
      || left.fuelType.localeCompare(right.fuelType)
    ));
};

export const summarizeFuelTruckBalanceRows = (
  rows: readonly FuelTruckBalanceRow[],
): FuelTruckBalanceSummary => rows.reduce<FuelTruckBalanceSummary>(
  (summary, row) => ({
    rowCount: summary.rowCount + 1,
    openingLiters: summary.openingLiters + row.openingLiters,
    supplierReceiptLiters: summary.supplierReceiptLiters + row.supplierReceiptLiters,
    vehicleIssueLiters: summary.vehicleIssueLiters + row.vehicleIssueLiters,
    contractorTransferLiters: summary.contractorTransferLiters + row.contractorTransferLiters,
    writeOffLiters: summary.writeOffLiters + row.writeOffLiters,
    correctionLiters: summary.correctionLiters + row.correctionLiters,
    calculatedClosingLiters: summary.calculatedClosingLiters + row.calculatedClosingLiters,
    actualClosingLiters: summary.actualClosingLiters + (row.actualClosingLiters ?? 0),
    discrepancyLiters: summary.discrepancyLiters + (row.discrepancyLiters ?? 0),
  }),
  {
    rowCount: 0,
    openingLiters: 0,
    supplierReceiptLiters: 0,
    vehicleIssueLiters: 0,
    contractorTransferLiters: 0,
    writeOffLiters: 0,
    correctionLiters: 0,
    calculatedClosingLiters: 0,
    actualClosingLiters: 0,
    discrepancyLiters: 0,
  },
);
