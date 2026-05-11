import { createStage2ActivationAuditPlan } from "../lib/domain/workspaces/stage2ActivationAuditPlan";
import {
  validateStage2ActivationEvidence,
  type Stage2ActivationEvidenceResult,
} from "../lib/domain/workspaces/stage2ActivationEvidenceValidation";
import {
  parseActivationScopeSize,
  parseEvidenceResult,
  parseLiveHandlerKeys,
  valueAfter,
  valuesAfter,
} from "./stage-2-cli-helpers";

type CliOptions = {
  help: boolean;
  requestedBy: string;
  reason: string;
  implementationPath?: string;
  verificationCommands: string[];
  rollbackPlan?: string;
  activationScopeSize?: number;
  preflightResult?: Stage2ActivationEvidenceResult;
  verifyResult?: Stage2ActivationEvidenceResult;
  smokeResult?: Stage2ActivationEvidenceResult;
  liveHandlerKeys: ReturnType<typeof parseLiveHandlerKeys>["liveHandlerKeys"];
  parseErrors: string[];
};

function printUsage() {
  console.log([
    "Usage: npm run check:stage2-activation-evidence -- [options]",
    "",
    "Validates read-only Stage 2 activation evidence before any manual live registry review.",
    "This command does not query MySQL, does not register live handlers, and does not mutate the live registry.",
    "JSON output includes expectedImplementationPath for the current activation target.",
    "",
    "Options:",
    "  --requested-by <name>              Name to store in evidence.",
    "  --reason <text>                    Change reason required before live registration.",
    "  --implementation-path <path>        Guarded handler implementation path.",
    "  --verification-command <command>    Command that was run; repeat for verify and smoke.",
    "  --rollback-plan <text>             Rollback plan for the single action.",
    "  --activation-scope-size <number>    Must be 1.",
    "  --preflight-result <missing|failed|passed>",
    "  --verify-result <missing|failed|passed>",
    "  --smoke-result <missing|failed|passed>",
    "  --live-handler <resource/action>    Simulate an already-live handler; repeat for multiple handlers.",
    "  --help                             Show this message.",
  ].join("\n"));
}

function parseCliOptions(argv: string[]): CliOptions {
  const liveHandlers = parseLiveHandlerKeys(valuesAfter(argv, "--live-handler"));
  const resultValues = [
    parseEvidenceResult(valueAfter(argv, "--preflight-result"), "--preflight-result"),
    parseEvidenceResult(valueAfter(argv, "--verify-result"), "--verify-result"),
    parseEvidenceResult(valueAfter(argv, "--smoke-result"), "--smoke-result"),
  ];
  const scopeSize = parseActivationScopeSize(valueAfter(argv, "--activation-scope-size"));

  return {
    help: argv.includes("--help") || argv.includes("-h"),
    requestedBy: valueAfter(argv, "--requested-by")?.trim() || "backend-engineer",
    reason: valueAfter(argv, "--reason")?.trim() || "",
    implementationPath: valueAfter(argv, "--implementation-path")?.trim(),
    verificationCommands: valuesAfter(argv, "--verification-command").map((value) => value.trim()),
    rollbackPlan: valueAfter(argv, "--rollback-plan")?.trim(),
    activationScopeSize: scopeSize.value,
    preflightResult: resultValues[0].value,
    verifyResult: resultValues[1].value,
    smokeResult: resultValues[2].value,
    liveHandlerKeys: liveHandlers.liveHandlerKeys,
    parseErrors: [
      ...liveHandlers.parseErrors,
      ...resultValues.flatMap((result) => (result.error ? [result.error] : [])),
      ...(scopeSize.error ? [scopeSize.error] : []),
    ],
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

  const auditPlan = createStage2ActivationAuditPlan(
    options.requestedBy,
    options.reason,
    options.liveHandlerKeys,
  );
  const validation = validateStage2ActivationEvidence(auditPlan, {
    requestedBy: options.requestedBy,
    changeReason: options.reason,
    implementationPath: options.implementationPath,
    verificationCommands: options.verificationCommands,
    rollbackPlan: options.rollbackPlan,
    activationScopeSize: options.activationScopeSize,
    preflightResult: options.preflightResult,
    verifyResult: options.verifyResult,
    smokeResult: options.smokeResult,
  });

  console.log(JSON.stringify({ auditPlan, validation }, null, 2));

  if (!validation.evidenceComplete) {
    process.exitCode = 1;
  }
}

run();
