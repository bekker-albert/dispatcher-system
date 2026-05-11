import {
  getModuleHandlerImplementationPlanEntry,
} from "../../domain/data-access/moduleHandlerImplementationPlan";
import {
  reviewModuleHandlerActivation,
  type ModuleHandlerActivationIssueCode,
} from "../../domain/data-access/moduleHandlerActivation";
import {
  createModuleHandlerRuntimeContract,
  type ModuleHandlerRuntimeRequirement,
} from "../../domain/data-access/moduleHandlerRuntimeContracts";
import {
  getModuleWritePipelinePlan,
  type ModuleWritePipelineKind,
} from "../../domain/data-access/moduleWritePipelinePlans";
import {
  createWriteReadModelLivePrerequisites,
  type WriteReadModelLivePrerequisites,
} from "../../domain/data-access/writeReadModelLivePrerequisites";
import type { DispatchWorkspaceId } from "../../domain/workspaces/workspaces";
import type { LiveModuleDatabaseHandlerFactoryKind } from "./module-live-handlers";

export type WriteLiveHandlerRegistrationCandidateIssueCode =
  | "activation_review_blocked"
  | "factory_kind_mismatch"
  | "implementation_path_invalid"
  | "implementation_path_required"
  | "missing_implementation_plan"
  | "missing_runtime_requirement"
  | "missing_write_pipeline"
  | "unsupported_contract_kind";

export type WriteLiveHandlerRegistrationCandidateReview = {
  resource: string;
  databaseAction: string;
  ready: boolean;
  moduleId?: string;
  workspaceId?: DispatchWorkspaceId;
  contractKind?: "write" | string;
  phase?: string;
  pipelineKind?: ModuleWritePipelineKind;
  expectedFactoryKind?: "create" | "patch";
  requestedFactoryKind: LiveModuleDatabaseHandlerFactoryKind;
  implementationPath: string;
  expectedImplementationPath: string;
  runtimeRequirements: ModuleHandlerRuntimeRequirement[];
  missingRuntimeRequirements: ModuleHandlerRuntimeRequirement[];
  activationIssues: ModuleHandlerActivationIssueCode[];
  readModelLivePrerequisites: WriteReadModelLivePrerequisites;
  liveActivationReady: boolean;
  liveActivationIssues: "read_model_live_prerequisite_missing"[];
  issues: WriteLiveHandlerRegistrationCandidateIssueCode[];
  registrationSummary?: {
    resource: string;
    databaseAction: string;
    factoryKind: "create" | "patch";
    implementationPath: string;
  };
  requiresGuardedFactory: true;
  requiresSinglePullRequest: true;
  noNewProcess: true;
  doesNotRegisterHandler: true;
};

const requiredWriteRuntimeRequirements: ModuleHandlerRuntimeRequirement[] = [
  "same_origin_write_guard",
  "atomic_write_transaction",
  "expected_version_check",
  "change_history_write",
  "post_commit_side_effects_only",
  "compact_write_response",
];
const invalidExpectedWriteImplementationPath = "lib/server/database/handlers/__invalid__/__invalid__.ts";

function getExpectedFactoryKind(pipelineKind?: ModuleWritePipelineKind): "create" | "patch" | undefined {
  if (pipelineKind === "create") return "create";
  if (pipelineKind === "patch" || pipelineKind === "workflow-transition") return "patch";

  return undefined;
}

function getMissingRuntimeRequirements(
  requirements: readonly ModuleHandlerRuntimeRequirement[],
) {
  return requiredWriteRuntimeRequirements.filter((requirement) => !requirements.includes(requirement));
}

function isAllowedWriteImplementationPath(
  resource: string,
  databaseAction: string,
  implementationPath: string,
) {
  const normalizedPath = normalizeImplementationPath(implementationPath);
  const expectedPath = createExpectedWriteImplementationPath(resource, databaseAction);

  return isSafeWriteImplementationTarget(resource, databaseAction)
    && !hasPathTraversal(normalizedPath)
    && normalizedPath.startsWith("lib/server/database/handlers/")
    && normalizedPath.endsWith(".ts")
    && normalizedPath === expectedPath;
}

export function createExpectedWriteImplementationPath(resource: string, databaseAction: string) {
  if (!isSafeWriteImplementationTarget(resource, databaseAction)) {
    return invalidExpectedWriteImplementationPath;
  }

  return `lib/server/database/handlers/${resource.trim()}/${databaseAction.trim()}.ts`;
}

export function isSafeWriteImplementationTarget(resource: string, databaseAction: string) {
  return isSafeImplementationPathSegment(resource)
    && isSafeImplementationPathSegment(databaseAction);
}

function isSafeImplementationPathSegment(segment: string) {
  return /^[a-z0-9][a-z0-9-]*$/.test(segment.trim());
}

function normalizeImplementationPath(implementationPath: string) {
  return implementationPath.trim().replaceAll("\\", "/");
}

function hasPathTraversal(implementationPath: string) {
  return implementationPath.split("/").includes("..");
}

export function reviewWriteLiveHandlerRegistrationCandidate(input: {
  resource: string;
  databaseAction: string;
  factoryKind: LiveModuleDatabaseHandlerFactoryKind;
  implementationPath: string;
  requestedBy: string;
  changeReason: string;
  verificationCommands: readonly string[];
  rollbackPlan: string;
  activationScopeSize?: number;
}): WriteLiveHandlerRegistrationCandidateReview {
  const entry = getModuleHandlerImplementationPlanEntry(input.resource, input.databaseAction);
  const pipeline = entry
    ? getModuleWritePipelinePlan(entry.moduleId, input.databaseAction)
    : undefined;
  const runtimeContract = createModuleHandlerRuntimeContract(input.resource, input.databaseAction);
  const activationReview = reviewModuleHandlerActivation({
    resource: input.resource,
    databaseAction: input.databaseAction,
    requestedBy: input.requestedBy,
    changeReason: input.changeReason,
    implementationPath: input.implementationPath,
    verificationCommands: input.verificationCommands,
    rollbackPlan: input.rollbackPlan,
    activationScopeSize: input.activationScopeSize,
  });
  const expectedFactoryKind = getExpectedFactoryKind(pipeline?.pipelineKind);
  const missingRuntimeRequirements = getMissingRuntimeRequirements(runtimeContract.requirements);
  const expectedImplementationPath = createExpectedWriteImplementationPath(
    input.resource,
    input.databaseAction,
  );
  const readModelLivePrerequisites = createWriteReadModelLivePrerequisites(
    input.resource,
    input.databaseAction,
  );
  const issues: WriteLiveHandlerRegistrationCandidateIssueCode[] = [
    ...(!entry ? ["missing_implementation_plan" as const] : []),
    ...(entry && (entry.contractKind !== "write" || entry.phase !== "write-workflow")
      ? ["unsupported_contract_kind" as const]
      : []),
    ...(!pipeline ? ["missing_write_pipeline" as const] : []),
    ...(!input.implementationPath.trim() ? ["implementation_path_required" as const] : []),
    ...(input.implementationPath.trim() && !isAllowedWriteImplementationPath(
      input.resource,
      input.databaseAction,
      input.implementationPath,
    )
      ? ["implementation_path_invalid" as const]
      : []),
    ...(expectedFactoryKind && input.factoryKind !== expectedFactoryKind
      ? ["factory_kind_mismatch" as const]
      : []),
    ...(missingRuntimeRequirements.length > 0 ? ["missing_runtime_requirement" as const] : []),
    ...(activationReview.status === "ready-to-register" ? [] : ["activation_review_blocked" as const]),
  ];
  const ready = issues.length === 0;
  const liveActivationIssues = readModelLivePrerequisites.ready
    ? []
    : ["read_model_live_prerequisite_missing" as const];

  return {
    resource: input.resource,
    databaseAction: input.databaseAction,
    ready,
    moduleId: entry?.moduleId,
    workspaceId: entry?.workspaceId,
    contractKind: entry?.contractKind,
    phase: entry?.phase,
    pipelineKind: pipeline?.pipelineKind,
    expectedFactoryKind,
    requestedFactoryKind: input.factoryKind,
    implementationPath: input.implementationPath,
    expectedImplementationPath,
    runtimeRequirements: runtimeContract.requirements,
    missingRuntimeRequirements,
    activationIssues: activationReview.issues,
    readModelLivePrerequisites,
    liveActivationReady: ready && liveActivationIssues.length === 0,
    liveActivationIssues,
    issues,
    ...(ready && expectedFactoryKind ? {
      registrationSummary: {
        resource: input.resource,
        databaseAction: input.databaseAction,
        factoryKind: expectedFactoryKind,
        implementationPath: input.implementationPath,
      },
    } : {}),
    requiresGuardedFactory: true,
    requiresSinglePullRequest: true,
    noNewProcess: true,
    doesNotRegisterHandler: true,
  };
}
