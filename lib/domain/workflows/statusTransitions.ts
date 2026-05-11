import type { CommonProcessStatus } from "../common-processes/service-contracts";
import type { MiningShiftReportStatus } from "../dispatch/service-contracts";
import type { VehicleMovementStatus } from "../fleet/service-contracts";
import type { FuelDrainCheckStatus } from "../smts/service-contracts";
import type { AssignmentPetitionStatus, FuelAccountingPeriodStatus, WaybillStatus } from "../taxation/service-contracts";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type DispatchWorkflowId =
  | "mining-shift-report"
  | "waybill"
  | "assignment-petition"
  | "fuel-accounting-period"
  | "vehicle-movement"
  | "fuel-drain-check"
  | "common-process";

export type WorkflowStatus =
  | MiningShiftReportStatus
  | WaybillStatus
  | AssignmentPetitionStatus
  | FuelAccountingPeriodStatus
  | VehicleMovementStatus
  | FuelDrainCheckStatus
  | CommonProcessStatus;

export type WorkflowTransitionRule<TStatus extends string = WorkflowStatus> = {
  from: TStatus;
  to: readonly TStatus[];
  requiresReason?: boolean;
  requiresApprovalRight?: boolean;
};

export type WorkflowDefinition<TStatus extends string = WorkflowStatus> = {
  id: DispatchWorkflowId;
  workspaceId: DispatchWorkspaceId;
  entityType: string;
  label: string;
  defaultStatus: TStatus;
  terminalStatuses: readonly TStatus[];
  transitions: readonly WorkflowTransitionRule<TStatus>[];
  savesPatchOnly: true;
  requiresVersionCheck: true;
  writesChangeHistory: true;
};

const createWorkflowDefinition = <TStatus extends string>(
  definition: WorkflowDefinition<TStatus>,
): WorkflowDefinition<TStatus> => definition;

export const workflowDefinitions = [
  createWorkflowDefinition<MiningShiftReportStatus>({
    id: "mining-shift-report",
    workspaceId: "mining-dispatch",
    entityType: "mining_shift_report",
    label: "Mining shift report",
    defaultStatus: "draft",
    terminalStatuses: ["closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "draft", to: ["submitted"] },
      { from: "submitted", to: ["reviewing", "returned"], requiresReason: true },
      { from: "reviewing", to: ["accepted", "returned"], requiresReason: true },
      { from: "returned", to: ["submitted"] },
      { from: "accepted", to: ["closed"], requiresApprovalRight: true },
      { from: "closed", to: [] },
    ],
  }),
  createWorkflowDefinition<WaybillStatus>({
    id: "waybill",
    workspaceId: "taxation",
    entityType: "waybill",
    label: "Waybill",
    defaultStatus: "draft",
    terminalStatuses: ["cancelled", "closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "draft", to: ["created", "cancelled"] },
      { from: "created", to: ["printed", "cancelled"], requiresReason: true },
      { from: "printed", to: ["reprinted", "closed", "cancelled"], requiresReason: true },
      { from: "reprinted", to: ["closed", "cancelled"], requiresReason: true },
      { from: "cancelled", to: [] },
      { from: "closed", to: [] },
    ],
  }),
  createWorkflowDefinition<AssignmentPetitionStatus>({
    id: "assignment-petition",
    workspaceId: "taxation",
    entityType: "assignment_petition",
    label: "Temporary assignment petition",
    defaultStatus: "draft",
    terminalStatuses: ["approved", "rejected", "cancelled", "expired"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "draft", to: ["submitted", "cancelled"] },
      { from: "submitted", to: ["chief_review", "cancelled"] },
      { from: "chief_review", to: ["approved", "rejected"], requiresApprovalRight: true, requiresReason: true },
      { from: "approved", to: ["expired", "cancelled"], requiresReason: true },
      { from: "rejected", to: [] },
      { from: "cancelled", to: [] },
      { from: "expired", to: [] },
    ],
  }),
  createWorkflowDefinition<FuelAccountingPeriodStatus>({
    id: "fuel-accounting-period",
    workspaceId: "taxation",
    entityType: "fuel_accounting_period",
    label: "Fuel accounting period",
    defaultStatus: "open",
    terminalStatuses: ["closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "open", to: ["reconciling"] },
      { from: "reconciling", to: ["supplier_reconciled", "returned"], requiresReason: true },
      { from: "supplier_reconciled", to: ["sent_to_1c", "returned"], requiresReason: true },
      { from: "sent_to_1c", to: ["closed", "returned"], requiresApprovalRight: true, requiresReason: true },
      { from: "returned", to: ["open", "reconciling"], requiresReason: true },
      { from: "closed", to: [] },
    ],
  }),
  createWorkflowDefinition<VehicleMovementStatus>({
    id: "vehicle-movement",
    workspaceId: "fleet",
    entityType: "vehicle_movement",
    label: "Vehicle movement document",
    defaultStatus: "draft",
    terminalStatuses: ["cancelled", "closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "draft", to: ["approval", "cancelled"] },
      { from: "approval", to: ["approved", "cancelled"], requiresApprovalRight: true, requiresReason: true },
      { from: "approved", to: ["in_transit", "cancelled"], requiresReason: true },
      { from: "in_transit", to: ["arrived"] },
      { from: "arrived", to: ["accepted"] },
      { from: "accepted", to: ["closed"], requiresApprovalRight: true },
      { from: "cancelled", to: [] },
      { from: "closed", to: [] },
    ],
  }),
  createWorkflowDefinition<FuelDrainCheckStatus>({
    id: "fuel-drain-check",
    workspaceId: "smts-gps",
    entityType: "fuel_drain_event",
    label: "Fuel drain check",
    defaultStatus: "new",
    terminalStatuses: ["closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "new", to: ["reviewing"] },
      { from: "reviewing", to: ["confirmed", "not_confirmed", "sensor_error"], requiresReason: true },
      { from: "confirmed", to: ["closed"] },
      { from: "not_confirmed", to: ["closed"] },
      { from: "sensor_error", to: ["closed"] },
      { from: "closed", to: [] },
    ],
  }),
  createWorkflowDefinition<CommonProcessStatus>({
    id: "common-process",
    workspaceId: "common-processes",
    entityType: "common_process",
    label: "Common dispatch service process",
    defaultStatus: "draft",
    terminalStatuses: ["rejected", "cancelled", "closed"],
    savesPatchOnly: true,
    requiresVersionCheck: true,
    writesChangeHistory: true,
    transitions: [
      { from: "draft", to: ["submitted", "cancelled"] },
      { from: "submitted", to: ["reviewing", "rejected", "cancelled"], requiresReason: true },
      { from: "reviewing", to: ["approved", "rejected"], requiresApprovalRight: true, requiresReason: true },
      { from: "approved", to: ["closed", "cancelled"], requiresReason: true },
      { from: "rejected", to: [] },
      { from: "cancelled", to: [] },
      { from: "closed", to: [] },
    ],
  }),
] as const satisfies readonly WorkflowDefinition[];

export const getWorkflowDefinition = (workflowId: DispatchWorkflowId): WorkflowDefinition => {
  const definition = workflowDefinitions.find((workflow) => workflow.id === workflowId);

  if (!definition) {
    throw new Error(`Unknown dispatch workflow: ${workflowId}`);
  }

  return definition;
};

export const getAllowedNextStatuses = (workflowId: DispatchWorkflowId, currentStatus: string): string[] => {
  const definition = getWorkflowDefinition(workflowId);
  const transition = definition.transitions.find((rule) => rule.from === currentStatus);

  return transition ? [...transition.to] : [];
};

export const canTransitionStatus = (
  workflowId: DispatchWorkflowId,
  currentStatus: string,
  nextStatus: string,
): boolean => getAllowedNextStatuses(workflowId, currentStatus).includes(nextStatus);

export const getTransitionRule = (
  workflowId: DispatchWorkflowId,
  currentStatus: string,
  nextStatus: string,
): WorkflowTransitionRule | undefined => {
  const definition = getWorkflowDefinition(workflowId);

  return definition.transitions.find(
    (rule) => rule.from === currentStatus && (rule.to as readonly string[]).includes(nextStatus),
  );
};

export const isTerminalWorkflowStatus = (workflowId: DispatchWorkflowId, status: string): boolean => {
  const definition = getWorkflowDefinition(workflowId);

  return (definition.terminalStatuses as readonly string[]).includes(status);
};
