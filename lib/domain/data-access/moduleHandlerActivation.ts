import {
  evaluateModuleHandlerImplementationGate,
  type ModuleHandlerImplementationPhase,
} from "./moduleHandlerImplementationPlan";
import {
  createModuleHandlerRuntimeContract,
  type ModuleHandlerRuntimeRequirement,
} from "./moduleHandlerRuntimeContracts";
import {
  getModuleLiveHandlerStatus,
  type ModuleLiveHandlerKey,
  type ModuleLiveHandlerStatus,
} from "./moduleLiveHandlerRegistry";
import type { DispatchWorkspaceId } from "../workspaces/workspaces";

export type ModuleHandlerActivationIssueCode =
  | "unknown_handler"
  | "already_live"
  | "batch_activation_forbidden"
  | "implementation_gate_blocked"
  | "runtime_contract_missing"
  | "missing_requested_by"
  | "missing_change_reason"
  | "missing_implementation_path"
  | "missing_verify_command"
  | "missing_rollback_plan";

export type ModuleHandlerActivationCommand = ModuleLiveHandlerKey & {
  requestedBy: string;
  changeReason: string;
  implementationPath: string;
  verificationCommands: readonly string[];
  rollbackPlan: string;
  activationScopeSize?: number;
};

export type ModuleHandlerActivationReview = ModuleLiveHandlerKey & {
  status: "ready-to-register" | "blocked";
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
  phase?: ModuleHandlerImplementationPhase;
  currentLiveStatus?: ModuleLiveHandlerStatus;
  readyToConnectHandler: boolean;
  runtimeRequirements: ModuleHandlerRuntimeRequirement[];
  issues: ModuleHandlerActivationIssueCode[];
  requiresRegistryChange: boolean;
  requiresSinglePullRequest: boolean;
  noNewProcess: true;
  nextRegistryEntry?: ModuleLiveHandlerKey;
};

const baseRuntimeRequirements: ModuleHandlerRuntimeRequirement[] = [
  "single_database_router_dispatch",
  "authorization_before_handler",
];

function hasVerifyCommand(commands: readonly string[]) {
  return commands.some((command) => command.trim() === "npm run verify");
}

function hasBaseRuntimeRequirements(requirements: readonly ModuleHandlerRuntimeRequirement[]) {
  return baseRuntimeRequirements.every((requirement) => requirements.includes(requirement));
}

export function reviewModuleHandlerActivation(
  command: ModuleHandlerActivationCommand,
  liveHandlerKeys: readonly ModuleLiveHandlerKey[] = [],
): ModuleHandlerActivationReview {
  const liveHandler = getModuleLiveHandlerStatus(
    command.resource,
    command.databaseAction,
    liveHandlerKeys,
  );
  const implementationGate = evaluateModuleHandlerImplementationGate(
    command.resource,
    command.databaseAction,
  );
  const runtimeContract = createModuleHandlerRuntimeContract(
    command.resource,
    command.databaseAction,
  );
  const issues: ModuleHandlerActivationIssueCode[] = [
    ...(!liveHandler ? ["unknown_handler" as const] : []),
    ...(liveHandler?.status === "live" ? ["already_live" as const] : []),
    ...((command.activationScopeSize ?? 1) !== 1 ? ["batch_activation_forbidden" as const] : []),
    ...(!implementationGate.readyToConnectHandler ? ["implementation_gate_blocked" as const] : []),
    ...(
      runtimeContract.requirements.length === 0
      || !hasBaseRuntimeRequirements(runtimeContract.requirements)
        ? ["runtime_contract_missing" as const]
        : []
    ),
    ...(command.requestedBy.trim() ? [] : ["missing_requested_by" as const]),
    ...(command.changeReason.trim() ? [] : ["missing_change_reason" as const]),
    ...(command.implementationPath.trim() ? [] : ["missing_implementation_path" as const]),
    ...(hasVerifyCommand(command.verificationCommands) ? [] : ["missing_verify_command" as const]),
    ...(command.rollbackPlan.trim() ? [] : ["missing_rollback_plan" as const]),
  ];
  const ready = issues.length === 0;

  return {
    resource: command.resource,
    databaseAction: command.databaseAction,
    status: ready ? "ready-to-register" : "blocked",
    moduleId: liveHandler?.moduleId,
    workspaceId: liveHandler?.workspaceId,
    phase: liveHandler?.phase,
    currentLiveStatus: liveHandler?.status,
    readyToConnectHandler: implementationGate.readyToConnectHandler,
    runtimeRequirements: runtimeContract.requirements,
    issues,
    requiresRegistryChange: ready,
    requiresSinglePullRequest: true,
    noNewProcess: true,
    ...(ready ? {
      nextRegistryEntry: {
        resource: command.resource,
        databaseAction: command.databaseAction,
      },
    } : {}),
  };
}
