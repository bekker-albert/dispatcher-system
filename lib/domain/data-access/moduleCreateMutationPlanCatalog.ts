import type { ModuleCreateMutationPlan } from "./moduleCreateMutationPlans";

function createMutationPlan(input: Omit<
  ModuleCreateMutationPlan,
  | "idColumn"
  | "versionColumn"
  | "createdAtColumn"
  | "createdByColumn"
  | "updatedAtColumn"
  | "updatedByColumn"
  | "initialVersion"
  | "returnsCreatedEntityId"
  | "writesChangeHistory"
  | "scopeColumns"
> & { scopeColumns?: ModuleCreateMutationPlan["scopeColumns"] }) {
  return {
    idColumn: "id",
    versionColumn: "version",
    createdAtColumn: "created_at",
    createdByColumn: "created_by",
    updatedAtColumn: "updated_at",
    updatedByColumn: "updated_by",
    initialVersion: 1,
    returnsCreatedEntityId: true,
    writesChangeHistory: true,
    scopeColumns: {},
    ...input,
  } satisfies ModuleCreateMutationPlan;
}

export const moduleCreateMutationPlans: ModuleCreateMutationPlan[] = [
  createMutationPlan({
    moduleId: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    resource: "dispatch",
    databaseAction: "create-shift-report",
    tableName: "mining_shift_reports",
    statusColumn: "status",
    initialStatus: "draft",
    requiredFieldGroups: ["date", "section", "shift", "crew_links"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [["report_date", "section_id", "shift"]],
  }),
  createMutationPlan({
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    resource: "taxation",
    databaseAction: "create-waybill",
    tableName: "taxation_waybills",
    statusColumn: "status",
    initialStatus: "created",
    requiredFieldGroups: ["date", "section", "shift", "driver", "vehicle"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [
      ["work_date", "section_id", "shift", "driver_id"],
      ["work_date", "section_id", "shift", "vehicle_id"],
    ],
  }),
  createMutationPlan({
    moduleId: "taxation-fuel-periods",
    workspaceId: "taxation",
    resource: "taxation",
    databaseAction: "create-fuel-period",
    tableName: "fuel_accounting_periods",
    statusColumn: "status",
    initialStatus: "open",
    requiredFieldGroups: ["section", "period"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [["section_id", "period_id"]],
  }),
  createMutationPlan({
    moduleId: "fleet-movements",
    workspaceId: "fleet",
    resource: "fleet",
    databaseAction: "create-vehicle-movement",
    tableName: "vehicle_movements",
    statusColumn: "status",
    initialStatus: "draft",
    requiredFieldGroups: ["vehicle", "from_section", "to_section", "basis"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [["vehicle_id", "departure_date", "status"]],
  }),
  createMutationPlan({
    moduleId: "service-vehicle",
    workspaceId: "fleet",
    resource: "fleet",
    databaseAction: "create-service-vehicle-record",
    tableName: "service_vehicle_records",
    statusColumn: "status",
    initialStatus: "draft",
    requiredFieldGroups: ["vehicle", "record_type", "basis"],
    duplicateKeyGroups: [["vehicle_id", "record_type", "created_at"]],
  }),
  createMutationPlan({
    moduleId: "common-overtime",
    workspaceId: "common-processes",
    resource: "common-processes",
    databaseAction: "create-overtime-request",
    tableName: "common_overtime_requests",
    statusColumn: "status",
    initialStatus: "draft",
    requiredFieldGroups: ["employee", "date", "hours", "reason"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [["employee_id", "work_date", "shift"]],
  }),
  createMutationPlan({
    moduleId: "common-business-trips",
    workspaceId: "common-processes",
    resource: "common-processes",
    databaseAction: "create-business-trip",
    tableName: "common_business_trips",
    statusColumn: "status",
    initialStatus: "draft",
    requiredFieldGroups: ["employee", "period", "route", "goal"],
    scopeColumns: { section_id: "section_id" },
    duplicateKeyGroups: [["employee_id", "start_date", "end_date", "route_hash"]],
  }),
  createMutationPlan({
    moduleId: "access-matrix",
    workspaceId: "admin",
    resource: "admin",
    databaseAction: "create-access-grant",
    tableName: "access_matrix_grants",
    statusColumn: "status",
    initialStatus: "active",
    requiredFieldGroups: ["subject", "scope", "capabilities", "reason"],
    duplicateKeyGroups: [["user_id", "role_id", "section_id", "module_id"]],
  }),
];
