import { createStage2ActivationOverview } from "../lib/domain/workspaces/stage2ActivationOverview";
import { valueAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-overview -- [--requested-by <name>]",
    "",
    "Prints the plan-only Stage 2 activation overview for read-model and write-handler rollout order.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --requested-by <name>  Name to include in generated preflight commands.",
    "  --help                 Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    requestedBy: valueAfter(argv, "--requested-by")?.trim() || "backend-engineer",
  };
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  console.log(JSON.stringify(createStage2ActivationOverview(options.requestedBy), null, 2));
}

run();
