import type { ModuleHandlerActivationCommand } from "../lib/domain/data-access/moduleHandlerActivation";
import { reviewModuleHandlerActivation } from "../lib/domain/data-access/moduleHandlerActivation";
import { getModuleLiveHandlerStatus } from "../lib/domain/data-access/moduleLiveHandlerRegistry";
import { createReadModelSchemaReviewPlan } from "../lib/domain/data-access/readModelSchemaPlan";
import { reviewMysqlReadModelLiveHandlerRegistrationCandidate } from "../lib/server/database/live-handler-registration-review";
import { isPlaceholderText, parseActivationScopeSizeOrNaN, valueAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  command?: ModuleHandlerActivationCommand;
};

const defaultImplementationPath = "lib/server/database/module-live-handlers.ts";
const defaultRollbackPlan = "Remove the live registry key and guarded registration.";

function printUsage() {
  console.log([
    "Usage: npm run plan:live-handler-activation -- --resource <resource> --action <database-action>",
    "",
    "Builds a non-mutating activation packet for one planned read-model handler.",
    "The packet does not connect to MySQL, does not edit the live registry, and does not apply migrations.",
    "",
    "Required flags:",
    "  --resource <resource>",
    "  --action <database-action>",
    "",
    "Optional flags:",
    "  --requested-by <name>             Defaults to codex.",
    "  --reason <text>                  Defaults to a bounded read-model activation reason.",
    "  --implementation-path <path>     Defaults to lib/server/database/module-live-handlers.ts.",
    "  --rollback-plan <text>           Defaults to removing the live registry key and registration.",
    "  --activation-scope-size <number> Defaults to 1.",
    "",
    "Stage 2 activation scope must be exactly 1.",
    "Reason and rollback plan must be specific; placeholders such as TODO, TBD, n/a, and none are blocked.",
    "  --help                           Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }

  const resource = valueAfter(argv, "--resource")?.trim();
  const databaseAction = valueAfter(argv, "--action")?.trim();
  const missingFlags = [
    ...(!resource ? ["--resource"] : []),
    ...(!databaseAction ? ["--action"] : []),
  ];

  if (missingFlags.length > 0) {
    console.error(`Missing required flags: ${missingFlags.join(", ")}`);
    printUsage();
    process.exit(1);
  }

  if (!resource || !databaseAction) {
    throw new Error("Activation packet required flags were not parsed.");
  }

  return {
    help: false,
    command: {
      resource,
      databaseAction,
      requestedBy: valueAfter(argv, "--requested-by")?.trim() || "codex",
      changeReason: valueAfter(argv, "--reason")?.trim()
        || `Prepare one-action activation packet for ${resource}/${databaseAction}.`,
      implementationPath: valueAfter(argv, "--implementation-path")?.trim()
        || defaultImplementationPath,
      verificationCommands: ["npm run verify"],
      rollbackPlan: valueAfter(argv, "--rollback-plan")?.trim() || defaultRollbackPlan,
      activationScopeSize: parseActivationScopeSizeOrNaN(valueAfter(argv, "--activation-scope-size")),
    },
  };
}

function createPacket(command: ModuleHandlerActivationCommand) {
  const activationReview = reviewModuleHandlerActivation(command);
  const liveStatus = getModuleLiveHandlerStatus(command.resource, command.databaseAction);
  const registrationCandidate = reviewMysqlReadModelLiveHandlerRegistrationCandidate({
    resource: command.resource,
    databaseAction: command.databaseAction,
    implementationPath: command.implementationPath,
  });
  const schemaPlan = activationReview.moduleId
    ? createReadModelSchemaReviewPlan({ moduleId: activationReview.moduleId })
    : undefined;
  const issues = [
    ...activationReview.issues.map((code) => ({ source: "activation" as const, code })),
    ...registrationCandidate.issues.map((code) => ({
      source: "registration" as const,
      code,
    })),
    ...createPacketTextIssues(command),
    { source: "schema" as const, code: "mysql_schema_not_checked" },
  ];

  return {
    mode: "activation-packet",
    ready: false,
    liveActivationReady: false,
    appliesChanges: false,
    databaseConnection: false,
    schemaChecked: false,
    liveRegistryMutation: false,
    handlerRegistrationMutation: false,
    resource: command.resource,
    databaseAction: command.databaseAction,
    activationScopeSize: command.activationScopeSize,
    currentLiveStatus: liveStatus?.status ?? "unknown",
    activationReview,
    registrationCandidate: {
      resource: registrationCandidate.resource,
      databaseAction: registrationCandidate.databaseAction,
      ready: registrationCandidate.ready,
      moduleId: registrationCandidate.moduleId,
      workspaceId: registrationCandidate.workspaceId,
      contractKind: registrationCandidate.contractKind,
      phase: registrationCandidate.phase,
      factoryKind: registrationCandidate.factoryKind,
      implementationPath: registrationCandidate.implementationPath,
      issues: registrationCandidate.issues,
      registrationSummary: registrationCandidate.registrationSummary,
    },
    schemaPlan,
    schemaPreflightGate: {
      ready: false,
      schemaChecked: false,
      requiredCommand: `npm run check:read-model-schema -- --module ${activationReview.moduleId ?? "<module-id>"}`,
      planningCommand: `npm run plan:read-model-schema -- --module ${activationReview.moduleId ?? "<module-id>"} --sql`,
      noLiveRegistrationFromPacket: true,
    },
    issues,
    nextCommands: [
      `npm run plan:read-model-schema -- --module ${activationReview.moduleId ?? "<module-id>"} --sql`,
      `npm run check:read-model-schema -- --module ${activationReview.moduleId ?? "<module-id>"}`,
      [
        "npm run review:live-handler --",
        `--resource ${command.resource}`,
        `--action ${command.databaseAction}`,
        `--requested-by ${command.requestedBy}`,
        `--reason "${command.changeReason}"`,
        `--implementation-path ${command.implementationPath}`,
        `--rollback-plan "${command.rollbackPlan}"`,
        `--activation-scope-size ${command.activationScopeSize ?? 1}`,
      ].join(" "),
      "npm run verify",
      "npm run smoke:local",
    ],
    stopConditions: [
      "Do not register a live handler from this packet alone.",
      "Stop if MySQL schema preflight is not ready.",
      "Stop if activation review is blocked.",
      "Stop if registration candidate is not ready.",
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
    throw new Error("Activation packet command was not parsed.");
  }

  const packet = createPacket(options.command);
  console.log(JSON.stringify(packet, null, 2));

  const hasBlockingIssue = packet.activationReview.status !== "ready-to-register"
    || !packet.registrationCandidate.ready
    || packet.currentLiveStatus === "unknown"
    || packet.issues.some((issue) => issue.source === "packet");

  if (hasBlockingIssue) process.exitCode = 1;
}

run();

function createPacketTextIssues(command: ModuleHandlerActivationCommand) {
  return [
    ...(isPlaceholderText(command.changeReason)
      ? [{ source: "packet" as const, code: "change_reason_placeholder" }]
      : []),
    ...(isPlaceholderText(command.rollbackPlan)
      ? [{ source: "packet" as const, code: "rollback_plan_placeholder" }]
      : []),
    ...(command.activationScopeSize === 1
      ? []
      : [{ source: "packet" as const, code: "activation_scope_not_one" }]),
  ];
}
