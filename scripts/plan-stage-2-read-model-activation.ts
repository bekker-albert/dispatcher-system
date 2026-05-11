import {
  createStage2FirstReadModelActivationChecklist,
  validateStage2FirstReadModelActivationChecklist,
} from "../lib/domain/workspaces/stage2ReadModelActivationChecklist";
import { createStage2FirstReadModelActivationSummary } from "../lib/domain/workspaces/stage2ReadModelActivationSummary";
import { valueAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
  summaryOnly: boolean;
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-read-models -- [--requested-by <name>]",
    "",
    "Prints the read-only activation checklist for the Stage 2 first read-model batch.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --requested-by <name>  Name to include in generated activation preflight commands.",
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

  const checklist = createStage2FirstReadModelActivationChecklist(options.requestedBy);
  const issues = validateStage2FirstReadModelActivationChecklist(checklist);
  const summary = createStage2FirstReadModelActivationSummary(options.requestedBy);

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
