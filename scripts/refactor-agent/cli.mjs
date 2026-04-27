export const validModes = new Set(["audit", "plan", "review"]);

export function parseArgs(argv) {
  const result = {
    help: false,
    offline: false,
    task: "",
    model: "",
    mode: "audit",
    target: "",
    output: "",
    includeUsages: true,
    includeDiff: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") result.help = true;
    else if (arg === "--offline") result.offline = true;
    else if (arg === "--task") result.task = argv[++i] || "";
    else if (arg.startsWith("--task=")) result.task = arg.slice("--task=".length);
    else if (arg === "--model") result.model = argv[++i] || "";
    else if (arg.startsWith("--model=")) result.model = arg.slice("--model=".length);
    else if (arg === "--mode") result.mode = argv[++i] || result.mode;
    else if (arg.startsWith("--mode=")) result.mode = arg.slice("--mode=".length);
    else if (arg === "--target") result.target = argv[++i] || "";
    else if (arg.startsWith("--target=")) result.target = arg.slice("--target=".length);
    else if (arg === "--output") result.output = argv[++i] || "";
    else if (arg.startsWith("--output=")) result.output = arg.slice("--output=".length);
    else if (arg === "--include-usages") result.includeUsages = true;
    else if (arg === "--no-usages") result.includeUsages = false;
    else if (arg === "--include-diff") result.includeDiff = true;
    else if (arg === "--no-diff") result.includeDiff = false;
  }

  result.mode = result.mode.toLowerCase();
  return result;
}

export function printHelp() {
  console.log([
    "AI refactor agent",
    "",
    "Usage:",
    "  npm run refactor:ai -- --mode audit --task \"Check project architecture\"",
    "  npm run refactor:ai -- --mode plan --target features/pto/PtoDateTableContainer.tsx",
    "  npm run refactor:ai -- --mode review --include-diff",
    "  npm run refactor:ai -- --offline --mode plan --target lib/domain/pto/date-table.ts",
    "",
    "Options:",
    "  --mode audit|plan|review     Report type. Default: audit.",
    "  --target <path>              Focus context on one repository file.",
    "  --include-usages             Include import/reference lines for target. Default: on.",
    "  --no-usages                  Do not include target usages.",
    "  --include-diff               Include current git diff. Default: on in review mode.",
    "  --no-diff                    Do not include current git diff.",
    "  --output <path>              Report output path. Default: tmp/refactor-ai-agent-report.md.",
    "  --model <name>               OpenAI model. Default: OPENAI_REFACTOR_MODEL or gpt-5.4.",
    "  --offline                    Save local context without calling OpenAI.",
    "",
    "Environment:",
    "  OPENAI_API_KEY=...",
    "  OPENAI_REFACTOR_MODEL=gpt-5.4",
    "  OPENAI_REFACTOR_MAX_OUTPUT_TOKENS=5000",
  ].join("\n"));
}

export function defaultTask(mode) {
  if (mode === "plan") return "Prepare a safe, small-step refactoring plan for the selected area.";
  if (mode === "review") return "Review the current diff for regressions, architecture drift, and missing checks.";
  return "Audit the project architecture and propose the next safe refactoring task.";
}

export function modeInstructions(mode) {
  if (mode === "plan") {
    return "Produce a practical implementation plan with file ownership, risk notes, and validation commands.";
  }

  if (mode === "review") {
    return "Review the supplied diff and context. Lead with findings, then tests and residual risk.";
  }

  return "Audit architecture health and identify the highest-value next refactoring step.";
}
