import path from "node:path";

import { buildProjectContext } from "./refactor-agent/context.mjs";
import { defaultTask, modeInstructions, parseArgs, printHelp, validModes } from "./refactor-agent/cli.mjs";
import { loadEnvFile } from "./refactor-agent/env.mjs";
import { createOpenAiResponse, extractOutputText, printOpenAiError } from "./refactor-agent/openai.mjs";
import { writeReport } from "./refactor-agent/report.mjs";

const root = process.cwd();
const defaultModel = "gpt-5.4";
const defaultOutputFile = path.join(root, "tmp", "refactor-ai-agent-report.md");

const args = parseArgs(process.argv.slice(2));
loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!validModes.has(args.mode)) {
  console.error(`Unknown mode: ${args.mode}`);
  console.error("Allowed modes: audit, plan, review");
  process.exit(1);
}

const task = args.task || defaultTask(args.mode);
const model = args.model || process.env.OPENAI_REFACTOR_MODEL || process.env.OPENAI_MODEL || defaultModel;
const apiKey = process.env.OPENAI_API_KEY;
const outputFile = resolveOutputFile(args.output || defaultOutputFile);
const context = buildProjectContext({
  root,
  task,
  mode: args.mode,
  target: args.target,
  includeUsages: args.includeUsages,
  includeDiff: args.includeDiff || args.mode === "review",
});

if (!apiKey && !args.offline) {
  console.error("OPENAI_API_KEY is missing. Add it to .env.local or environment variables.");
  console.error("For a local report without AI, run: npm run refactor:ai -- --offline");
  process.exit(1);
}

if (args.offline) {
  writeReport({
    root,
    outputFile,
    mode: args.mode,
    target: args.target,
    markdown: ["# Refactor AI Agent: offline context", "", "AI was not called because `--offline` was used.", "", context].join("\n"),
  });
  process.exit(0);
}

const apiResult = await createOpenAiResponse(apiKey, {
  model,
  instructions: modeInstructions(args.mode),
  input: buildPrompt(context),
  max_output_tokens: Number(process.env.OPENAI_REFACTOR_MAX_OUTPUT_TOKENS || 5000),
  store: false,
});

if (!apiResult.ok) {
  printOpenAiError(apiResult.status, apiResult.body?.error?.message || apiResult.statusText || "unknown error");
  process.exit(1);
}

const outputText = extractOutputText(apiResult.body);
if (!outputText) {
  console.error("OpenAI API did not return text output.");
  process.exit(1);
}

writeReport({
  root,
  outputFile,
  mode: args.mode,
  target: args.target,
  markdown: outputText,
});

function buildPrompt(context) {
  return [
    "You are a senior/fullstack architecture review agent for a production dispatcher system.",
    "Your job is to reduce load on the main developer by finding concrete architecture risks, safe next refactoring steps, and review concerns.",
    "",
    "Rules:",
    "- Answer in Russian.",
    "- Do not suggest moving core logic into app/page.tsx.",
    "- Do not suggest editing user data, .env files, databases, or production servers unless the task explicitly asks for that.",
    "- Prefer small, reviewable steps over large rewrites.",
    "- For every recommendation, name the exact files involved.",
    "- Separate blockers, next actions, risks, and technical debt.",
    "- Do not invent repository state outside the context below.",
    "- If the mode is review, lead with concrete regressions or risky changes.",
    "",
    context,
  ].join("\n");
}

function resolveOutputFile(outputPath) {
  const absolutePath = path.resolve(root, outputPath);
  const relativePath = path.relative(root, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    console.error("--output must stay inside the repository.");
    process.exit(1);
  }

  return absolutePath;
}
