import type { DataAccessQueryPolicy } from "./queryPolicy";
import {
  adminMatrixQueryPolicy,
  datedSectionQueryPolicy,
  defaultHeavyTableQueryPolicy,
  gpsEventsQueryPolicy,
  periodSectionStatusQueryPolicy,
  shiftSectionStatusQueryPolicy,
  vehicleScopedStatusQueryPolicy,
  vehicleStatusQueryPolicy,
} from "./queryPolicy";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";
import type { WorkspaceModuleCatalogItem, WorkspaceTableStrategy } from "../workspaces/moduleCatalog";
import { workspaceModuleCatalog } from "../workspaces/moduleCatalog";

export type WorkspaceModuleQueryPolicyBinding = {
  moduleId: string;
  workspaceId: DispatchWorkspaceId;
  policy: DataAccessQueryPolicy;
  reason: string;
};

const queryPolicyRequiredStrategies: WorkspaceTableStrategy[] = [
  "server-paginated",
  "aggregate",
  "on-demand-export",
];

export const workspaceModuleQueryPolicyBindings: WorkspaceModuleQueryPolicyBinding[] = [
  {
    moduleId: "mining-shift-reports",
    workspaceId: "mining-dispatch",
    policy: shiftSectionStatusQueryPolicy,
    reason: "Shift report lists must be bounded by date, section, shift and status.",
  },
  {
    moduleId: "mining-operational-accounting",
    workspaceId: "mining-dispatch",
    policy: datedSectionQueryPolicy,
    reason: "Operational accounting is built from accepted reports for a bounded date and section.",
  },
  {
    moduleId: "taxation-waybills",
    workspaceId: "taxation",
    policy: defaultHeavyTableQueryPolicy,
    reason: "Waybill lists must stay bounded before batch print or single issue workflows.",
  },
  {
    moduleId: "taxation-fuel-periods",
    workspaceId: "taxation",
    policy: periodSectionStatusQueryPolicy,
    reason: "Fuel accounting is queried by 1C period, section and workflow status.",
  },
  {
    moduleId: "smts-vehicle-cards",
    workspaceId: "smts-gps",
    policy: vehicleScopedStatusQueryPolicy,
    reason: "SMTS cards are vehicle-scoped and must not load the full equipment register.",
  },
  {
    moduleId: "smts-fuel-drains",
    workspaceId: "smts-gps",
    policy: gpsEventsQueryPolicy,
    reason: "GPS/Wialon events use the narrow GPS policy with a short date range.",
  },
  {
    moduleId: "fleet-movements",
    workspaceId: "fleet",
    policy: vehicleScopedStatusQueryPolicy,
    reason: "Vehicle movement history is opened by section, vehicle and document status.",
  },
  {
    moduleId: "service-vehicle",
    workspaceId: "fleet",
    policy: vehicleStatusQueryPolicy,
    reason: "Service vehicle documents are scoped by vehicle and status.",
  },
  {
    moduleId: "common-overtime",
    workspaceId: "common-processes",
    policy: defaultHeavyTableQueryPolicy,
    reason: "Overtime requests are queried by bounded period, section and workflow status.",
  },
  {
    moduleId: "common-business-trips",
    workspaceId: "common-processes",
    policy: defaultHeavyTableQueryPolicy,
    reason: "Business trips are queried by bounded period, section and workflow status.",
  },
  {
    moduleId: "prepared-reports",
    workspaceId: "reports",
    policy: defaultHeavyTableQueryPolicy,
    reason: "Prepared reports must be selected by bounded period, section and status.",
  },
  {
    moduleId: "access-matrix",
    workspaceId: "admin",
    policy: adminMatrixQueryPolicy,
    reason: "Access grants are administrative data and must be paged by scope and status.",
  },
];

export function getWorkspaceModulesRequiringQueryPolicy(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  return modules.filter((module) => queryPolicyRequiredStrategies.includes(module.tableStrategy));
}

export function getWorkspaceModuleQueryPolicy(moduleId: string) {
  return workspaceModuleQueryPolicyBindings.find((binding) => binding.moduleId === moduleId);
}

export function listWorkspaceModuleQueryPolicies(workspaceId?: DispatchWorkspaceId) {
  return workspaceModuleQueryPolicyBindings.filter((binding) => (
    workspaceId ? binding.workspaceId === workspaceId : true
  ));
}

export function getWorkspaceModulesWithoutQueryPolicy(
  modules: readonly WorkspaceModuleCatalogItem[] = workspaceModuleCatalog,
) {
  const coveredModuleIds = new Set(workspaceModuleQueryPolicyBindings.map((binding) => binding.moduleId));
  return getWorkspaceModulesRequiringQueryPolicy(modules).filter((module) => !coveredModuleIds.has(module.id));
}
