import {
  createStage2ActivationAuditPlan,
} from "../lib/domain/workspaces/stage2ActivationAuditPlan";
import { parseLiveHandlerKeys, valueAfter, valuesAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
  reason: string;
  liveHandlerKeys: ReturnType<typeof parseLiveHandlerKeys>["liveHandlerKeys"];
  parseErrors: string[];
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-activation-audit -- [--requested-by <name>] [--reason <text>] [--live-handler <resource/action>]",
    "",
    "Prints the read-only Stage 2 activation audit requirements for the next single action.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --requested-by <name>            Name to store in the activation audit plan.",
    "  --reason <text>                  Change reason required before live registration.",
    "  --live-handler <resource/action>  Simulate an already-live handler; repeat for multiple handlers.",
    "  --help                           Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  const liveHandlers = parseLiveHandlerKeys(valuesAfter(argv, "--live-handler"));

  return {
    help: argv.includes("--help") || argv.includes("-h"),
    requestedBy: valueAfter(argv, "--requested-by")?.trim() || "backend-engineer",
    reason: valueAfter(argv, "--reason")?.trim() || "Plan one Stage 2 live handler activation.",
    liveHandlerKeys: liveHandlers.liveHandlerKeys,
    parseErrors: liveHandlers.parseErrors,
  };
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  if (options.parseErrors.length > 0) {
    console.error(options.parseErrors.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(
    createStage2ActivationAuditPlan(options.requestedBy, options.reason, options.liveHandlerKeys),
    null,
    2,
  ));
}

run();
