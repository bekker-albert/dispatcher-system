import type {
  ServiceVehicleCard,
  ServiceVehicleInsurance,
  ServiceVehicleMaintenance,
  ServiceVehicleTireSet,
} from "./service-contracts";

export type ServiceVehicleReminderKind =
  | "maintenance_mileage_due"
  | "maintenance_mileage_soon"
  | "maintenance_date_due"
  | "maintenance_date_soon"
  | "insurance_expired"
  | "insurance_expiring"
  | "tire_resource_low"
  | "tire_resource_overrun";

export type ServiceVehicleReminderSeverity = "critical" | "warning" | "info";

export type ServiceVehicleReminder = {
  id: string;
  serviceVehicleId: string;
  vehicleId: string;
  kind: ServiceVehicleReminderKind;
  severity: ServiceVehicleReminderSeverity;
  sourceId?: string;
  dueDate?: string;
  dueMileage?: number;
  currentMileage?: number;
  message: string;
};

export type ServiceVehicleReminderInput = {
  currentDate: string;
  vehicles: readonly ServiceVehicleCard[];
  maintenance: readonly ServiceVehicleMaintenance[];
  insurance: readonly ServiceVehicleInsurance[];
  tireSets: readonly ServiceVehicleTireSet[];
  expiringSoonDays?: number;
  mileageWarningKm?: number;
  tireMileageLimitKm?: number;
  tireWarningKm?: number;
};

export type ServiceVehicleReminderCounts = Record<ServiceVehicleReminderSeverity, number> & {
  total: number;
};

const severityRank: Record<ServiceVehicleReminderSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function buildServiceVehicleReminders(input: ServiceVehicleReminderInput): ServiceVehicleReminder[] {
  const currentDay = toDateOnly(input.currentDate);
  const expiringSoonDays = input.expiringSoonDays ?? 30;
  const mileageWarningKm = input.mileageWarningKm ?? 500;
  const tireMileageLimitKm = input.tireMileageLimitKm ?? 50_000;
  const tireWarningKm = input.tireWarningKm ?? 5_000;
  const soonDate = addDays(currentDay, expiringSoonDays);
  const latestMaintenance = indexLatestMaintenance(input.maintenance);
  const latestInsurance = indexLatestInsurance(input.insurance);
  const activeTires = indexActiveTires(input.tireSets);
  const reminders: ServiceVehicleReminder[] = [];

  for (const vehicle of input.vehicles) {
    const maintenance = latestMaintenance.get(vehicle.id);
    if (maintenance) {
      reminders.push(...buildMaintenanceReminders(vehicle, maintenance, currentDay, soonDate, mileageWarningKm));
    }

    const insurance = latestInsurance.get(vehicle.id);
    if (insurance) {
      reminders.push(...buildInsuranceReminders(vehicle, insurance, currentDay, soonDate));
    }

    for (const tireSet of activeTires.get(vehicle.id) ?? []) {
      const usedMileage = resolveTireMileage(vehicle, tireSet);
      if (usedMileage === undefined) {
        continue;
      }

      if (usedMileage >= tireMileageLimitKm) {
        reminders.push(createReminder({
          vehicle,
          kind: "tire_resource_overrun",
          severity: "critical",
          sourceId: tireSet.id,
          currentMileage: vehicle.currentMileage,
          message: `Tire set ${tireSet.tireType} is over the ${tireMileageLimitKm} km service limit`,
        }));
      } else if (tireMileageLimitKm - usedMileage <= tireWarningKm) {
        reminders.push(createReminder({
          vehicle,
          kind: "tire_resource_low",
          severity: "warning",
          sourceId: tireSet.id,
          currentMileage: vehicle.currentMileage,
          message: `Tire set ${tireSet.tireType} has ${tireMileageLimitKm - usedMileage} km before service limit`,
        }));
      }
    }
  }

  return reminders.sort((left, right) => (
    severityRank[left.severity] - severityRank[right.severity]
    || left.serviceVehicleId.localeCompare(right.serviceVehicleId)
    || left.kind.localeCompare(right.kind)
    || (left.sourceId ?? "").localeCompare(right.sourceId ?? "")
  ));
}

export function summarizeServiceVehicleReminders(
  reminders: readonly ServiceVehicleReminder[],
): ServiceVehicleReminderCounts {
  return reminders.reduce<ServiceVehicleReminderCounts>((summary, reminder) => ({
    ...summary,
    total: summary.total + 1,
    [reminder.severity]: summary[reminder.severity] + 1,
  }), {
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
}

function buildMaintenanceReminders(
  vehicle: ServiceVehicleCard,
  maintenance: ServiceVehicleMaintenance,
  currentDay: Date,
  soonDate: Date,
  mileageWarningKm: number,
): ServiceVehicleReminder[] {
  const reminders: ServiceVehicleReminder[] = [];

  if (maintenance.nextMileage !== undefined) {
    const remainingMileage = maintenance.nextMileage - vehicle.currentMileage;
    if (remainingMileage <= 0) {
      reminders.push(createReminder({
        vehicle,
        kind: "maintenance_mileage_due",
        severity: "critical",
        sourceId: maintenance.id,
        dueMileage: maintenance.nextMileage,
        currentMileage: vehicle.currentMileage,
        message: `Maintenance mileage is overdue by ${Math.abs(remainingMileage)} km`,
      }));
    } else if (remainingMileage <= mileageWarningKm) {
      reminders.push(createReminder({
        vehicle,
        kind: "maintenance_mileage_soon",
        severity: "warning",
        sourceId: maintenance.id,
        dueMileage: maintenance.nextMileage,
        currentMileage: vehicle.currentMileage,
        message: `Maintenance mileage is due in ${remainingMileage} km`,
      }));
    }
  }

  if (maintenance.nextDate) {
    const nextDate = toDateOnly(maintenance.nextDate);
    if (nextDate < currentDay) {
      reminders.push(createReminder({
        vehicle,
        kind: "maintenance_date_due",
        severity: "critical",
        sourceId: maintenance.id,
        dueDate: maintenance.nextDate,
        message: "Maintenance date is overdue",
      }));
    } else if (nextDate <= soonDate) {
      reminders.push(createReminder({
        vehicle,
        kind: "maintenance_date_soon",
        severity: "warning",
        sourceId: maintenance.id,
        dueDate: maintenance.nextDate,
        message: "Maintenance date is approaching",
      }));
    }
  }

  return reminders;
}

function buildInsuranceReminders(
  vehicle: ServiceVehicleCard,
  insurance: ServiceVehicleInsurance,
  currentDay: Date,
  soonDate: Date,
): ServiceVehicleReminder[] {
  const endsAt = toDateOnly(insurance.endsAt);
  if (endsAt < currentDay) {
    return [createReminder({
      vehicle,
      kind: "insurance_expired",
      severity: "critical",
      sourceId: insurance.id,
      dueDate: insurance.endsAt,
      message: "Insurance policy is expired",
    })];
  }

  if (endsAt <= soonDate) {
    return [createReminder({
      vehicle,
      kind: "insurance_expiring",
      severity: "warning",
      sourceId: insurance.id,
      dueDate: insurance.endsAt,
      message: "Insurance policy is expiring soon",
    })];
  }

  return [];
}

function createReminder(input: {
  vehicle: ServiceVehicleCard;
  kind: ServiceVehicleReminderKind;
  severity: ServiceVehicleReminderSeverity;
  message: string;
  sourceId?: string;
  dueDate?: string;
  dueMileage?: number;
  currentMileage?: number;
}): ServiceVehicleReminder {
  const sourceSuffix = input.sourceId ? `:${input.sourceId}` : "";
  return {
    id: `${input.vehicle.id}:${input.kind}${sourceSuffix}`,
    serviceVehicleId: input.vehicle.id,
    vehicleId: input.vehicle.vehicleId,
    kind: input.kind,
    severity: input.severity,
    sourceId: input.sourceId,
    dueDate: input.dueDate,
    dueMileage: input.dueMileage,
    currentMileage: input.currentMileage,
    message: input.message,
  };
}

function indexLatestMaintenance(
  maintenanceItems: readonly ServiceVehicleMaintenance[],
): Map<string, ServiceVehicleMaintenance> {
  const byVehicle = new Map<string, ServiceVehicleMaintenance>();
  for (const item of maintenanceItems) {
    const current = byVehicle.get(item.serviceVehicleId);
    if (!current || isMaintenanceNewer(item, current)) {
      byVehicle.set(item.serviceVehicleId, item);
    }
  }
  return byVehicle;
}

function isMaintenanceNewer(left: ServiceVehicleMaintenance, right: ServiceVehicleMaintenance): boolean {
  return left.maintenanceDate > right.maintenanceDate
    || (left.maintenanceDate === right.maintenanceDate && left.mileage > right.mileage);
}

function indexLatestInsurance(
  insuranceItems: readonly ServiceVehicleInsurance[],
): Map<string, ServiceVehicleInsurance> {
  const byVehicle = new Map<string, ServiceVehicleInsurance>();
  for (const item of insuranceItems) {
    const current = byVehicle.get(item.serviceVehicleId);
    if (!current || item.endsAt > current.endsAt) {
      byVehicle.set(item.serviceVehicleId, item);
    }
  }
  return byVehicle;
}

function indexActiveTires(
  tireSets: readonly ServiceVehicleTireSet[],
): Map<string, ServiceVehicleTireSet[]> {
  const byVehicle = new Map<string, ServiceVehicleTireSet[]>();
  for (const tireSet of tireSets) {
    if (!tireSet.installedAt || tireSet.removedAt) {
      continue;
    }

    const current = byVehicle.get(tireSet.serviceVehicleId) ?? [];
    current.push(tireSet);
    byVehicle.set(tireSet.serviceVehicleId, current);
  }
  return byVehicle;
}

function resolveTireMileage(vehicle: ServiceVehicleCard, tireSet: ServiceVehicleTireSet): number | undefined {
  if (tireSet.totalMileage !== undefined) {
    return tireSet.totalMileage;
  }

  if (tireSet.installedMileage !== undefined) {
    return Math.max(0, vehicle.currentMileage - tireSet.installedMileage);
  }

  return undefined;
}

function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
