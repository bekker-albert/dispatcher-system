import type { LiveModuleDatabaseHandlerFactoryKind } from "../lib/server/database/module-live-handlers";
import {
  isSafeWriteImplementationTarget,
  reviewWriteLiveHandlerRegistrationCandidate,
} from "../lib/server/database/write-handler-registration-review";
import { isPlaceholderText, parseActivationScopeSizeOrNaN, valueAfter } from "./stage-2-cli-helpers";

type WriteHandlerFactoryKind = Extract<LiveModuleDatabaseHandlerFactoryKind, "create" | "patch">;

type CliOptions = {
  help: boolean;
  factoryKind?: WriteHandlerFactoryKind;
  resource?: string;
  databaseAction?: string;
  requestedBy?: string;
  changeReason?: string;
  implementationPath?: string;
  rollbackPlan?: string;
  activationScopeSize: number;
};

const allowedFactoryKinds: readonly WriteHandlerFactoryKind[] = [
  "create",
  "patch",
];

function printUsage() {
  console.log([
    "Usage: npm run review:write-handler -- --resource <resource> --action <database-action> --factory-kind <create|patch> --requested-by <name> --reason <text> --implementation-path <path> --rollback-plan <text>",
    "",
    "Runs the passive registration review for one future live write handler candidate.",
    "The review does not connect to MySQL, does not edit the live registry, and does not register a handler.",
    "",
    "Required flags:",
    "  --resource <resource>",
    "  --action <database-action>",
    "  --factory-kind <create|patch>",
    "  --requested-by <name>",
    "  --reason <text>",
    "  --implementation-path <path>",
    "  --rollback-plan <text>",
    "",
    "Optional flags:",
    "  --activation-scope-size <number>  Defaults to 1.",
    "",
    "Stage 2 activation scope must be exactly 1.",
    "Resource/action keys must be lowercase path segments with digits or hyphens only.",
    "Traversal, slashes, backslashes, uppercase letters, and empty segments are blocked with handler_key_invalid.",
    "Reason and rollback plan must be specific; placeholders such as TODO, TBD, n/a, and none are blocked.",
    "  --help                            Show this message.",
  ].join("\n"));
}

function parseFactoryKind(value: string | undefined) {
  const factoryKind = value?.trim() as WriteHandlerFactoryKind | undefined;
  if (!factoryKind || !allowedFactoryKinds.includes(factoryKind)) return undefined;

  return factoryKind;
}

function parseCliOptions(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { help: true, activationScopeSize: 1 };
  }

  const resource = valueAfter(argv, "--resource")?.trim();
  const databaseAction = valueAfter(argv, "--action")?.trim();
  const factoryKind = parseFactoryKind(valueAfter(argv, "--factory-kind"));
  const requestedBy = valueAfter(argv, "--requested-by")?.trim();
  const changeReason = valueAfter(argv, "--reason")?.trim();
  const implementationPath = valueAfter(argv, "--implementation-path")?.trim();
  const rollbackPlan = valueAfter(argv, "--rollback-plan")?.trim();
  const activationScopeSize = parseActivationScopeSizeOrNaN(valueAfter(argv, "--activation-scope-size"));
  const missingFlags = [
    ...(!resource ? ["--resource"] : []),
    ...(!databaseAction ? ["--action"] : []),
    ...(!factoryKind ? ["--factory-kind"] : []),
    ...(!requestedBy ? ["--requested-by"] : []),
    ...(!changeReason ? ["--reason"] : []),
    ...(!implementationPath ? ["--implementation-path"] : []),
    ...(!rollbackPlan ? ["--rollback-plan"] : []),
  ];

  if (missingFlags.length > 0) {
    console.error(`Missing or invalid required flags: ${missingFlags.join(", ")}`);
    printUsage();
    process.exit(1);
  }

  return {
    help: false,
    resource,
    databaseAction,
    factoryKind,
    requestedBy,
    changeReason,
    implementationPath,
    rollbackPlan,
    activationScopeSize,
  };
}

function createReviewPacket(options: Required<Omit<CliOptions, "help">>) {
  const cliIssues = createCliTextIssues(options);
  const review = reviewWriteLiveHandlerRegistrationCandidate({
    resource: options.resource,
    databaseAction: options.databaseAction,
    factoryKind: options.factoryKind,
    implementationPath: options.implementationPath,
    requestedBy: options.requestedBy,
    changeReason: options.changeReason,
    verificationCommands: ["npm run verify"],
    rollbackPlan: options.rollbackPlan,
    activationScopeSize: options.activationScopeSize,
  });

  return {
    mode: "write-handler-registration-review",
    ready: review.ready && cliIssues.length === 0,
    liveActivationReady: review.liveActivationReady,
    appliesChanges: false,
    liveRegistryMutation: false,
    databaseConnection: false,
    doesNotRegisterHandler: review.doesNotRegisterHandler,
    issues: cliIssues,
    review,
    nextCommands: [
      "npm run verify",
      "npm run smoke:local",
    ],
    stopConditions: [
      "Do not register a live write handler from this review alone.",
      "Stop if the expected guarded factory does not match.",
      "Stop if compact_write_response is missing from runtime requirements.",
      "Stop if activation review is blocked.",
      "Stop if read-model live prerequisites are not live.",
      "Stop if handler_key_invalid is present for resource/action.",
      "Stop if the change needs more than one live handler key.",
    ],
  };
}

function createCliTextIssues(options: Required<Omit<CliOptions, "help">>) {
  return [
    ...(isPlaceholderText(options.changeReason)
      ? [{ source: "cli" as const, code: "change_reason_placeholder" }]
      : []),
    ...(isPlaceholderText(options.rollbackPlan)
      ? [{ source: "cli" as const, code: "rollback_plan_placeholder" }]
      : []),
    ...(isSafeWriteImplementationTarget(options.resource, options.databaseAction)
      ? []
      : [{ source: "cli" as const, code: "handler_key_invalid" }]),
    ...(options.activationScopeSize === 1
      ? []
      : [{ source: "cli" as const, code: "activation_scope_not_one" }]),
  ];
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (
    !options.resource ||
    !options.databaseAction ||
    !options.factoryKind ||
    !options.requestedBy ||
    !options.changeReason ||
    !options.implementationPath ||
    !options.rollbackPlan
  ) {
    throw new Error("Write handler review required flags were not parsed.");
  }

  const packet = createReviewPacket({
    resource: options.resource,
    databaseAction: options.databaseAction,
    factoryKind: options.factoryKind,
    requestedBy: options.requestedBy,
    changeReason: options.changeReason,
    implementationPath: options.implementationPath,
    rollbackPlan: options.rollbackPlan,
    activationScopeSize: options.activationScopeSize,
  });
  console.log(JSON.stringify(packet, null, 2));

  if (!packet.ready) process.exitCode = 1;
}

run();
