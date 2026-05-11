import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { ModuleHandlerActivationCommand } from "../lib/domain/data-access/moduleHandlerActivation";
import {
  reviewLiveHandlerActivationContractOnlyPreflight,
  reviewMysqlLiveHandlerActivationPreflight,
} from "../lib/server/mysql/live-handler-activation-preflight";
import { isPlaceholderText, parseActivationScopeSizeOrNaN, valueAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  contractOnly: boolean;
  help: boolean;
  command?: ModuleHandlerActivationCommand;
};

function printUsage() {
  console.log([
    "Usage: npm run review:live-handler -- --resource <resource> --action <database-action> --requested-by <name> --reason <text> --implementation-path <path> --rollback-plan <text>",
    "",
    "Runs the read-only activation preflight for one live handler candidate.",
    "The preflight combines reviewModuleHandlerActivation and the MySQL read-model schema check.",
    "",
    "Required flags:",
    "  --resource <resource>",
    "  --action <database-action>",
    "  --requested-by <name>",
    "  --reason <text>",
    "  --implementation-path <path>",
    "  --rollback-plan <text>",
    "",
    "Optional flags:",
    "  --activation-scope-size <number>  Defaults to 1.",
    "  --contract-only                   Review activation contracts without connecting to MySQL; never reports ready.",
    "",
    "Stage 2 activation scope must be exactly 1.",
    "Reason and rollback plan must be specific; placeholders such as TODO, TBD, n/a, and none are blocked.",
    "  --help                            Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { contractOnly: false, help: true };
  }

  const resource = valueAfter(argv, "--resource")?.trim();
  const databaseAction = valueAfter(argv, "--action")?.trim();
  const requestedBy = valueAfter(argv, "--requested-by")?.trim();
  const changeReason = valueAfter(argv, "--reason")?.trim();
  const implementationPath = valueAfter(argv, "--implementation-path")?.trim();
  const rollbackPlan = valueAfter(argv, "--rollback-plan")?.trim();
  const activationScopeSize = parseActivationScopeSizeOrNaN(valueAfter(argv, "--activation-scope-size"));
  const missingFlags = [
    ...(!resource ? ["--resource"] : []),
    ...(!databaseAction ? ["--action"] : []),
    ...(!requestedBy ? ["--requested-by"] : []),
    ...(!changeReason ? ["--reason"] : []),
    ...(!implementationPath ? ["--implementation-path"] : []),
    ...(!rollbackPlan ? ["--rollback-plan"] : []),
  ];

  if (missingFlags.length > 0) {
    console.error(`Missing required flags: ${missingFlags.join(", ")}`);
    printUsage();
    process.exit(1);
  }

  if (!resource || !databaseAction || !requestedBy || !changeReason || !implementationPath || !rollbackPlan) {
    throw new Error("Activation preflight required flags were not parsed.");
  }

  return {
    contractOnly: argv.includes("--contract-only"),
    help: false,
    command: {
      resource,
      databaseAction,
      requestedBy,
      changeReason,
      implementationPath,
      verificationCommands: ["npm run verify"],
      rollbackPlan,
      activationScopeSize,
    },
  };
}

function loadDotEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!(key in process.env)) process.env[key] = value;
  }
}

function sanitizedErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const name = error.name?.trim();
    const message = error.message?.trim() || "Unknown error";
    return name ? `${name}: ${message}` : message;
  }

  if (typeof error === "string") return error;
  return "Unknown error";
}

async function closeConnections() {
  const { closeMysqlPool } = await import("../lib/server/mysql/connection");
  await closeMysqlPool();
}

async function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (!options.command) {
    throw new Error("Activation command was not parsed.");
  }

  const cliIssues = createCliTextIssues(options.command);
  if (cliIssues.length > 0) {
    console.log(JSON.stringify({
      mode: "cli-validation",
      ready: false,
      appliesChanges: false,
      liveRegistryMutation: false,
      handlerRegistrationMutation: false,
      noLiveRegistrationFromPreflight: true,
      issues: cliIssues,
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  const result = options.contractOnly
    ? reviewLiveHandlerActivationContractOnlyPreflight(options.command)
    : await reviewFullMysqlPreflight(options.command);

  console.log(JSON.stringify(result, null, 2));

  if (!result.ready) {
    process.exitCode = 1;
  }
}

async function reviewFullMysqlPreflight(command: ModuleHandlerActivationCommand) {
  loadDotEnvLocal();
  return await reviewMysqlLiveHandlerActivationPreflight(command);
}

run()
  .then(closeConnections)
  .catch(async (error) => {
    console.error(sanitizedErrorMessage(error));
    await closeConnections().catch(() => undefined);
    process.exit(1);
  });

function createCliTextIssues(command: ModuleHandlerActivationCommand) {
  return [
    ...(isPlaceholderText(command.changeReason)
      ? [{ source: "cli" as const, code: "change_reason_placeholder" }]
      : []),
    ...(isPlaceholderText(command.rollbackPlan)
      ? [{ source: "cli" as const, code: "rollback_plan_placeholder" }]
      : []),
    ...(command.activationScopeSize === 1
      ? []
      : [{ source: "cli" as const, code: "activation_scope_not_one" }]),
  ];
}
