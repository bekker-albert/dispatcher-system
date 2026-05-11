import type {
  ContractorFuelDebt,
  DriverVehicleAssignment,
  FuelAccountingPeriod,
  Waybill,
} from "./service-contracts";
import { isDriverVehicleAssignmentActiveOnDate } from "./waybillIssuance";

export type TaxationControlRangeKind =
  | "shift"
  | "day"
  | "watch"
  | "first_half"
  | "second_half"
  | "month"
  | "year";

export type TaxationFuelIssueControlRow = {
  id: string;
  sectionId: string;
  vehicleId: string;
  driverId?: string;
  waybillId?: string;
  liters: number;
};

export type TaxationFuelNormControlRow = {
  sectionId: string;
  vehicleId: string;
  driverId?: string;
  normLiters: number;
  actualLiters: number;
};

export type TaxationSupervisorControlSignal =
  | "missing_waybill_by_assignment"
  | "fuel_issue_without_waybill"
  | "waybill_without_fuel"
  | "overconsumption"
  | "suspicious_economy"
  | "contractor_debt_open"
  | "fuel_period_not_closed";

export type TaxationSupervisorControlInput = {
  workDate: string;
  rangeKind: TaxationControlRangeKind;
  sectionIds: readonly string[];
  assignments: readonly DriverVehicleAssignment[];
  waybills: readonly Pick<Waybill, "id" | "sectionId" | "driverId" | "vehicleId" | "status">[];
  fuelIssues: readonly TaxationFuelIssueControlRow[];
  fuelNormRows?: readonly TaxationFuelNormControlRow[];
  contractorDebts?: readonly Pick<ContractorFuelDebt, "sectionId" | "liters" | "status">[];
  fuelPeriods?: readonly Pick<FuelAccountingPeriod, "sectionId" | "status">[];
  suspiciousEconomyThresholdLiters?: number;
};

export type TaxationSupervisorControlRow = {
  sectionId: string;
  rangeKind: TaxationControlRangeKind;
  assignedPairCount: number;
  issuedWaybillCount: number;
  missingWaybillCount: number;
  fuelWithoutWaybillCount: number;
  waybillWithoutFuelCount: number;
  overconsumptionLiters: number;
  suspiciousEconomyLiters: number;
  contractorDebtLiters: number;
  openFuelPeriodCount: number;
  signals: TaxationSupervisorControlSignal[];
};

const activeWaybillStatuses = new Set<Waybill["status"]>(["draft", "created", "printed", "reprinted", "closed"]);
const defaultSuspiciousEconomyThresholdLiters = 100;

const assignmentPairKey = (item: Pick<DriverVehicleAssignment, "driverId" | "vehicleId">) => (
  `${item.driverId}|${item.vehicleId}`
);

function pushSignal(
  signals: TaxationSupervisorControlSignal[],
  condition: boolean,
  signal: TaxationSupervisorControlSignal,
) {
  if (condition) signals.push(signal);
}

export function buildTaxationSupervisorControlRows(
  input: TaxationSupervisorControlInput,
): TaxationSupervisorControlRow[] {
  const suspiciousEconomyThresholdLiters = input.suspiciousEconomyThresholdLiters
    ?? defaultSuspiciousEconomyThresholdLiters;

  return input.sectionIds.map((sectionId) => {
    const assignments = input.assignments.filter((assignment) => (
      assignment.sectionId === sectionId
      && isDriverVehicleAssignmentActiveOnDate(assignment, input.workDate)
    ));
    const waybills = input.waybills.filter((waybill) => (
      waybill.sectionId === sectionId && activeWaybillStatuses.has(waybill.status)
    ));
    const fuelIssues = input.fuelIssues.filter((issue) => issue.sectionId === sectionId);
    const fuelNormRows = input.fuelNormRows?.filter((row) => row.sectionId === sectionId) ?? [];
    const contractorDebts = input.contractorDebts?.filter((debt) => (
      debt.sectionId === sectionId && debt.status === "open"
    )) ?? [];
    const openFuelPeriods = input.fuelPeriods?.filter((period) => (
      period.sectionId === sectionId && period.status !== "closed"
    )) ?? [];
    const waybillPairs = new Set(waybills.map(assignmentPairKey));
    const fuelWaybillIds = new Set(fuelIssues.flatMap((issue) => issue.waybillId ? [issue.waybillId] : []));
    const missingWaybillCount = assignments.filter((assignment) => !waybillPairs.has(assignmentPairKey(assignment))).length;
    const fuelWithoutWaybillCount = fuelIssues.filter((issue) => !issue.waybillId).length;
    const waybillWithoutFuelCount = waybills.filter((waybill) => !fuelWaybillIds.has(waybill.id)).length;
    const overconsumptionLiters = fuelNormRows.reduce(
      (sum, row) => sum + Math.max(row.actualLiters - row.normLiters, 0),
      0,
    );
    const suspiciousEconomyLiters = fuelNormRows.reduce((sum, row) => {
      const economy = row.normLiters - row.actualLiters;
      return economy >= suspiciousEconomyThresholdLiters ? sum + economy : sum;
    }, 0);
    const contractorDebtLiters = contractorDebts.reduce((sum, debt) => sum + debt.liters, 0);
    const signals: TaxationSupervisorControlSignal[] = [];

    pushSignal(signals, missingWaybillCount > 0, "missing_waybill_by_assignment");
    pushSignal(signals, fuelWithoutWaybillCount > 0, "fuel_issue_without_waybill");
    pushSignal(signals, waybillWithoutFuelCount > 0, "waybill_without_fuel");
    pushSignal(signals, overconsumptionLiters > 0, "overconsumption");
    pushSignal(signals, suspiciousEconomyLiters > 0, "suspicious_economy");
    pushSignal(signals, contractorDebtLiters > 0, "contractor_debt_open");
    pushSignal(signals, openFuelPeriods.length > 0, "fuel_period_not_closed");

    return {
      sectionId,
      rangeKind: input.rangeKind,
      assignedPairCount: assignments.length,
      issuedWaybillCount: waybills.length,
      missingWaybillCount,
      fuelWithoutWaybillCount,
      waybillWithoutFuelCount,
      overconsumptionLiters,
      suspiciousEconomyLiters,
      contractorDebtLiters,
      openFuelPeriodCount: openFuelPeriods.length,
      signals,
    };
  });
}
