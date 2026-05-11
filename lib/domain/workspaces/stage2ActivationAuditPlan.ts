import type { ModuleLiveHandlerKey } from "../data-access/moduleLiveHandlerRegistry";
import {
  createStage2NextActivationPlan,
  type Stage2NextActivationAction,
} from "./stage2NextActivationAction";

export type Stage2ActivationAuditField =
  | "phase"
  | "moduleId"
  | "workspaceId"
  | "resource"
  | "databaseAction"
  | "requestedBy"
  | "changeReason"
  | "implementationPath"
  | "verificationCommands"
  | "rollbackPlan"
  | "activationScopeSize"
  | "preflightResult"
  | "verifyResult"
  | "smokeResult";

export type Stage2ActivationAuditPlan = {
  requestedBy: string;
  changeReason: string;
  reasonRequired: true;
  auditRequired: true;
  auditRecordRequiredBeforeRegistryMutation: true;
  liveRegistrationAllowedFromAuditPlan: false;
  maxParallelLiveRegistrations: 1;
  activationScopeSize: 1;
  noMysqlConnection: true;
  liveRegistryMutation: false;
  handlerRegistrationMutation: false;
  requiredFields: Stage2ActivationAuditField[];
  requiredCommands: string[];
  target?: Pick<
    Stage2NextActivationAction,
    "phase" | "moduleId" | "workspaceId" | "resource" | "databaseAction" | "implementationPath"
  >;
  rollbackPlan: "Remove the single live registry key and guarded server registration";
  rule: string;
};

const stage2ActivationAuditRequiredFields: Stage2ActivationAuditField[] = [
  "phase",
  "moduleId",
  "workspaceId",
  "resource",
  "databaseAction",
  "requestedBy",
  "changeReason",
  "implementationPath",
  "verificationCommands",
  "rollbackPlan",
  "activationScopeSize",
  "preflightResult",
  "verifyResult",
  "smokeResult",
];

export function createStage2ActivationAuditPlan(
  requestedBy = "backend-engineer",
  changeReason = "Plan one Stage 2 live handler activation.",
  liveHandlerKeys?: readonly ModuleLiveHandlerKey[],
): Stage2ActivationAuditPlan {
  const nextPlan = createStage2NextActivationPlan(requestedBy, liveHandlerKeys);
  const requiredCommands = [
    ...(nextPlan.nextAction?.requiredCommands ?? []),
    "npm run smoke:local",
  ];

  return {
    requestedBy,
    changeReason,
    reasonRequired: true,
    auditRequired: true,
    auditRecordRequiredBeforeRegistryMutation: true,
    liveRegistrationAllowedFromAuditPlan: false,
    maxParallelLiveRegistrations: 1,
    activationScopeSize: 1,
    noMysqlConnection: true,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    requiredFields: [...stage2ActivationAuditRequiredFields],
    requiredCommands,
    ...(nextPlan.nextAction ? { target: toAuditTarget(nextPlan.nextAction) } : {}),
    rollbackPlan: "Remove the single live registry key and guarded server registration",
    rule: "Record an activation audit entry with reason, preflight, verify and smoke evidence before any live registry mutation.",
  };
}

function toAuditTarget(
  nextAction: Stage2NextActivationAction,
): Stage2ActivationAuditPlan["target"] {
  return {
    phase: nextAction.phase,
    moduleId: nextAction.moduleId,
    workspaceId: nextAction.workspaceId,
    resource: nextAction.resource,
    databaseAction: nextAction.databaseAction,
    implementationPath: nextAction.implementationPath,
  };
}
