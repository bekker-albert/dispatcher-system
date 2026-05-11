import {
  createStage2WriteHandlerActivationChecklist,
  validateStage2WriteHandlerActivationChecklist,
} from "../lib/domain/workspaces/stage2WriteHandlerActivationChecklist";
import {
  createStage2WriteHandlerActivationSummary,
} from "../lib/domain/workspaces/stage2WriteHandlerActivationSummary";
import { valueAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
  summaryOnly: boolean;
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-write-handlers -- [--requested-by <name>]",
    "",
    "Prints the plan-only checklist for the Stage 2 write-handler rollout.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --requested-by <name>  Name to include in generated write review commands.",
    "  --summary-only         Print only the compact readiness summary.",
    "  --help                 Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  return {
    help: argv.includes("--help") || argv.includes("-h"),
    requestedBy: valueAfter(argv, "--requested-by")?.trim() || "backend-engineer",
    summaryOnly: argv.includes("--summary-only"),
  };
}

function run() {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const checklist = createStage2WriteHandlerActivationChecklist(options.requestedBy);
  const issues = validateStage2WriteHandlerActivationChecklist(checklist);
  const summary = createStage2WriteHandlerActivationSummary(options.requestedBy);

  const payload = options.summaryOnly
    ? summary
    : {
        requestedBy: options.requestedBy,
        ready: issues.length === 0,
        issues,
        summary,
        ...checklist,
      };

  console.log(JSON.stringify(payload, null, 2));

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

run();
