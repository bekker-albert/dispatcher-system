import {
  createStage2LiveReadinessSnapshot,
} from "../lib/domain/workspaces/stage2LiveReadinessSnapshot";
import { parseLiveHandlerKeys, valuesAfter } from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  liveHandlerKeys: ReturnType<typeof parseLiveHandlerKeys>["liveHandlerKeys"];
  parseErrors: string[];
};

function printUsage() {
  console.log([
    "Usage: npm run plan:stage2-live-readiness -- [--live-handler <resource/action>]",
    "",
    "Prints the read-only Stage 2 live-readiness snapshot for first-batch read models and write-handler gates.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "",
    "Options:",
    "  --live-handler <resource/action>  Simulate an already-live handler; repeat for multiple handlers.",
    "  --help                           Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  const liveHandlers = parseLiveHandlerKeys(valuesAfter(argv, "--live-handler"));

  return {
    help: argv.includes("--help") || argv.includes("-h"),
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

  console.log(JSON.stringify(createStage2LiveReadinessSnapshot(options.liveHandlerKeys), null, 2));
}

run();
