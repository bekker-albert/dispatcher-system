import {
  createStage2NextActivationPlan,
} from "../lib/domain/workspaces/stage2NextActivationAction";
import { parseLiveHandlerKeys, valueAfter, valuesAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
  liveHandlerKeys: ReturnType<typeof parseLiveHandlerKeys>["liveHandlerKeys"];
  parseErrors: string[];
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-next-action -- [--requested-by <name>] [--live-handler <resource/action>]",
    "",
    "Prints the next read-only Stage 2 activation action from current live-readiness inputs.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --requested-by <name>            Name to include in generated preflight/review commands.",
    "  --live-handler <resource/action>  Simulate an already-live handler; repeat for multiple handlers.",
    "  --help                           Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  const liveHandlers = parseLiveHandlerKeys(valuesAfter(argv, "--live-handler"));

  return {
    help: argv.includes("--help") || argv.includes("-h"),
    requestedBy: valueAfter(argv, "--requested-by")?.trim() || "backend-engineer",
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
    createStage2NextActivationPlan(options.requestedBy, options.liveHandlerKeys),
    null,
    2,
  ));
}

run();
