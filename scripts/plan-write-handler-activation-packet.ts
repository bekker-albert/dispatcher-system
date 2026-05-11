import type { ModuleHandlerActivationCommand } from "../lib/domain/data-access/moduleHandlerActivation";
import { reviewModuleHandlerActivation } from "../lib/domain/data-access/moduleHandlerActivation";
import { getModuleLiveHandlerStatus } from "../lib/domain/data-access/moduleLiveHandlerRegistry";
import { createWriteReadModelLivePrerequisites } from "../lib/domain/data-access/writeReadModelLivePrerequisites";
import type { LiveModuleDatabaseHandlerFactoryKind } from "../lib/server/database/module-live-handlers";
import {
  createExpectedWriteImplementationPath,
  isSafeWriteImplementationTarget,
  reviewWriteLiveHandlerRegistrationCandidate,
} from "../lib/server/database/write-handler-registration-review";
import { isPlaceholderText, parseActivationScopeSizeOrNaN, valueAfter } from "./stage-2-cli-helpers";

type WriteHandlerFactoryKind = Extract<LiveModuleDatabaseHandlerFactoryKind, "create" | "patch">;

type WriteHandlerActivationCommand = ModuleHandlerActivationCommand & {
  factoryKind: WriteHandlerFactoryKind;
};

type CliOptions = {
  help: boolean;
  command?: WriteHandlerActivationCommand;
};

const allowedFactoryKinds: readonly WriteHandlerFactoryKind[] = ["create", "patch"];
const defaultRollbackPlan = "Remove the live registry key and guarded write registration.";

function printUsage() {
  console.log([
    "Usage: npm run plan:write-handler-activation -- --resource <resource> --action <database-action> --factory-kind <create|patch>",
    "",
    "Builds a non-mutating activation packet for one planned write handler.",
    "The packet does not connect to MySQL, does not edit the live registry, and does not register a handler.",
    "",
    "Required flags:",
    "  --resource <resource>",
    "  --action <database-action>",
    "  --factory-kind <create|patch>",
    "",
    "Optional flags:",
    "  --requested-by <name>             Defaults to codex.",
    "  --reason <text>                  Defaults to a bounded write-handler activation reason.",
    "  --implementation-path <path>     Defaults to lib/server/database/handlers/<resource>/<action>.ts.",
    "  --rollback-plan <text>           Defaults to removing the live registry key and write registration.",
    "  --activation-scope-size <number> Defaults to 1.",
    "",
    "Stage 2 activation scope must be exactly 1.",
    "Resource/action keys must be lowercase path segments with digits or hyphens only.",
    "Traversal, slashes, backslashes, uppercase letters, and empty segments are blocked with handler_key_invalid.",
    "Reason and rollback plan must be specific; placeholders such as TODO, TBD, n/a, and none are blocked.",
    "  --help                           Show this message.",
  ].join("\n"));
}

function parseFactoryKind(value: string | undefined) {
  const factoryKind = value?.trim() as WriteHandlerFactoryKind | undefined;
  if (!factoryKind || !allowedFactoryKinds.includes(factoryKind)) return undefined;

  return factoryKind;
}

function parseCliOptions(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }

  const resource = valueAfter(argv, "--resource")?.trim();
  const databaseAction = valueAfter(argv, "--action")?.trim();
  const factoryKind = parseFactoryKind(valueAfter(argv, "--factory-kind"));
  const activationScopeSize = parseActivationScopeSizeOrNaN(valueAfter(argv, "--activation-scope-size"));
  const missingFlags = [
    ...(!resource ? ["--resource"] : []),
    ...(!databaseAction ? ["--action"] : []),
    ...(!factoryKind ? ["--factory-kind"] : []),
  ];

  if (missingFlags.length > 0) {
    console.error(`Missing or invalid required flags: ${missingFlags.join(", ")}`);
    printUsage();
    process.exit(1);
  }

  if (!resource || !databaseAction || !factoryKind) {
    throw new Error("Write handler activation packet required flags were not parsed.");
  }

  return {
    help: false,
    command: {
      resource,
      databaseAction,
      factoryKind,
      requestedBy: valueAfter(argv, "--requested-by")?.trim() || "codex",
      changeReason: valueAfter(argv, "--reason")?.trim()
        || `Prepare one-action write-handler activation packet for ${resource}/${databaseAction}.`,
      implementationPath: valueAfter(argv, "--implementation-path")?.trim()
        || createExpectedWriteImplementationPath(resource, databaseAction),
      verificationCommands: ["npm run verify"],
      rollbackPlan: valueAfter(argv, "--rollback-plan")?.trim() || defaultRollbackPlan,
      activationScopeSize,
    },
  };
}

function createPacket(command: WriteHandlerActivationCommand) {
  const activationReview = reviewModuleHandlerActivation(command);
  const liveStatus = getModuleLiveHandlerStatus(command.resource, command.databaseAction);
  const readModelLivePrerequisites = createWriteReadModelLivePrerequisites(
    command.resource,
    command.databaseAction,
  );
  const writeRegistrationCandidate = reviewWriteLiveHandlerRegistrationCandidate({
    resource: command.resource,
    databaseAction: command.databaseAction,
    factoryKind: command.factoryKind,
    implementationPath: command.implementationPath,
    requestedBy: command.requestedBy,
    changeReason: command.changeReason,
    verificationCommands: command.verificationCommands,
    rollbackPlan: command.rollbackPlan,
    activationScopeSize: command.activationScopeSize,
  });
  const issues = [
    ...activationReview.issues.map((code) => ({ source: "activation" as const, code })),
    ...writeRegistrationCandidate.issues.map((code) => ({
      source: "registration" as const,
      code,
    })),
    ...createPacketTextIssues(command),
    ...(readModelLivePrerequisites.ready ? [] : [{
      source: "packet" as const,
      code: "read_model_live_prerequisite_missing",
    }]),
    { source: "packet" as const, code: "write_handler_not_registered" },
  ];
  const handlerKeySafe = isSafeWriteImplementationTarget(command.resource, command.databaseAction);
  const reviewCommand = [
    "npm run review:write-handler --",
    `--resource ${command.resource}`,
    `--action ${command.databaseAction}`,
    `--factory-kind ${command.factoryKind}`,
    `--requested-by ${command.requestedBy}`,
    `--reason "${command.changeReason}"`,
    `--implementation-path ${writeRegistrationCandidate.expectedImplementationPath}`,
    `--rollback-plan "${command.rollbackPlan}"`,
    `--activation-scope-size ${command.activationScopeSize ?? 1}`,
  ].join(" ");

  return {
    mode: "write-handler-activation-packet",
    ready: false,
    appliesChanges: false,
    databaseConnection: false,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    resource: command.resource,
    databaseAction: command.databaseAction,
    activationScopeSize: command.activationScopeSize,
    requestedFactoryKind: command.factoryKind,
    currentLiveStatus: liveStatus?.status ?? "unknown",
    readModelLivePrerequisites,
    activationReview,
    writeRegistrationCandidate: {
      resource: writeRegistrationCandidate.resource,
      databaseAction: writeRegistrationCandidate.databaseAction,
      ready: writeRegistrationCandidate.ready,
      moduleId: writeRegistrationCandidate.moduleId,
      workspaceId: writeRegistrationCandidate.workspaceId,
      contractKind: writeRegistrationCandidate.contractKind,
      phase: writeRegistrationCandidate.phase,
      pipelineKind: writeRegistrationCandidate.pipelineKind,
      expectedFactoryKind: writeRegistrationCandidate.expectedFactoryKind,
      requestedFactoryKind: writeRegistrationCandidate.requestedFactoryKind,
      implementationPath: writeRegistrationCandidate.implementationPath,
      expectedImplementationPath: writeRegistrationCandidate.expectedImplementationPath,
      runtimeRequirements: writeRegistrationCandidate.runtimeRequirements,
      missingRuntimeRequirements: writeRegistrationCandidate.missingRuntimeRequirements,
      activationIssues: writeRegistrationCandidate.activationIssues,
      issues: writeRegistrationCandidate.issues,
      registrationSummary: writeRegistrationCandidate.registrationSummary,
      requiresGuardedFactory: writeRegistrationCandidate.requiresGuardedFactory,
      requiresSinglePullRequest: writeRegistrationCandidate.requiresSinglePullRequest,
      noNewProcess: writeRegistrationCandidate.noNewProcess,
      doesNotRegisterHandler: writeRegistrationCandidate.doesNotRegisterHandler,
    },
    issues,
    nextCommands: [
      ...(handlerKeySafe ? [reviewCommand] : []),
      "npm run verify",
      "npm run smoke:local",
    ],
    stopConditions: [
      "Do not register a live write handler from this packet alone.",
      "Stop if write registration candidate is not ready.",
      "Stop if the expected guarded factory does not match.",
      "Stop if compact_write_response is missing from runtime requirements.",
      "Stop if activation review is blocked.",
      "Stop if read-model live prerequisites are not live.",
      "Stop if handler_key_invalid is present for resource/action.",
      "Stop if the change needs more than one live handler key.",
    ],
  };
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (!options.command) {
    throw new Error("Write handler activation packet command was not parsed.");
  }

  const packet = createPacket(options.command);
  console.log(JSON.stringify(packet, null, 2));

  const hasBlockingIssue = packet.activationReview.status !== "ready-to-register"
    || !packet.writeRegistrationCandidate.ready
    || packet.currentLiveStatus === "unknown"
    || hasPacketValidationIssue(packet.issues);

  if (hasBlockingIssue) process.exitCode = 1;
}

run();

function createPacketTextIssues(command: WriteHandlerActivationCommand) {
  return [
    ...(isPlaceholderText(command.changeReason)
      ? [{ source: "packet" as const, code: "change_reason_placeholder" }]
      : []),
    ...(isPlaceholderText(command.rollbackPlan)
      ? [{ source: "packet" as const, code: "rollback_plan_placeholder" }]
      : []),
    ...(isSafeWriteImplementationTarget(command.resource, command.databaseAction)
      ? []
      : [{ source: "packet" as const, code: "handler_key_invalid" }]),
    ...(command.activationScopeSize === 1
      ? []
      : [{ source: "packet" as const, code: "activation_scope_not_one" }]),
  ];
}

function hasPacketValidationIssue(issues: Array<{ source: string; code: string }>) {
  return issues.some((issue) => (
    issue.source === "packet"
    && (
      issue.code === "change_reason_placeholder"
      || issue.code === "rollback_plan_placeholder"
      || issue.code === "handler_key_invalid"
      || issue.code === "activation_scope_not_one"
    )
  ));
}
