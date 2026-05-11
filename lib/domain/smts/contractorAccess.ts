import type { ContractorMonitoringAccess } from "./service-contracts";

export type ContractorAccessIssueCode =
  | "active_after_valid_to"
  | "active_before_valid_from"
  | "active_without_approval"
  | "extra_vehicle_visible"
  | "access_expiring_soon";

export type ContractorAccessIssue = {
  accessId: string;
  contractorId: string;
  userId: string;
  code: ContractorAccessIssueCode;
  vehicleId?: string;
  validTo?: string;
  message: string;
};

export type ContractorAccessControlInput = {
  currentDate: string;
  accesses: readonly ContractorMonitoringAccess[];
  allowedVehicleIdsByContractor?: Readonly<Record<string, readonly string[]>>;
  expiringSoonDays?: number;
};

const defaultExpiringSoonDays = 7;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

export function isContractorMonitoringAccessActiveOnDate(
  access: Pick<ContractorMonitoringAccess, "status" | "validFrom" | "validTo" | "disabledAt">,
  currentDate: string,
) {
  return access.status === "active"
    && !access.disabledAt
    && access.validFrom <= currentDate
    && access.validTo >= currentDate;
}

export function buildContractorMonitoringAccessIssues({
  currentDate,
  accesses,
  allowedVehicleIdsByContractor = {},
  expiringSoonDays = defaultExpiringSoonDays,
}: ContractorAccessControlInput): ContractorAccessIssue[] {
  const expiringSoonDate = addDays(currentDate, expiringSoonDays);

  return accesses.flatMap((access) => {
    const issues: ContractorAccessIssue[] = [];

    if (access.status === "active" && access.validTo < currentDate && !access.disabledAt) {
      issues.push({
        accessId: access.id,
        contractorId: access.contractorId,
        userId: access.userId,
        code: "active_after_valid_to",
        validTo: access.validTo,
        message: "Contractor monitoring access is still active after the allowed period.",
      });
    }

    if (access.status === "active" && access.validFrom > currentDate) {
      issues.push({
        accessId: access.id,
        contractorId: access.contractorId,
        userId: access.userId,
        code: "active_before_valid_from",
        message: "Contractor monitoring access is active before the allowed period starts.",
      });
    }

    if (access.status === "active" && !access.approvedBy) {
      issues.push({
        accessId: access.id,
        contractorId: access.contractorId,
        userId: access.userId,
        code: "active_without_approval",
        message: "Contractor monitoring access is active without approval.",
      });
    }

    const allowedVehicleIds = allowedVehicleIdsByContractor[access.contractorId];
    if (allowedVehicleIds) {
      const allowedVehicleIdSet = new Set(allowedVehicleIds);
      for (const vehicleId of access.visibleVehicleIds) {
        if (!allowedVehicleIdSet.has(vehicleId)) {
          issues.push({
            accessId: access.id,
            contractorId: access.contractorId,
            userId: access.userId,
            code: "extra_vehicle_visible",
            vehicleId,
            message: "Contractor monitoring access exposes a vehicle outside the allowed scope.",
          });
        }
      }
    }

    if (isContractorMonitoringAccessActiveOnDate(access, currentDate) && access.validTo <= expiringSoonDate) {
      issues.push({
        accessId: access.id,
        contractorId: access.contractorId,
        userId: access.userId,
        code: "access_expiring_soon",
        validTo: access.validTo,
        message: "Contractor monitoring access expires soon.",
      });
    }

    return issues;
  });
}
