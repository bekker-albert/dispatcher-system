import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const scriptDir = resolve(root, "scripts");
const workspaceDomainDir = resolve(root, "lib", "domain", "workspaces");
const stage2CliFiles = readdirSync(scriptDir)
  .filter((name) => name.includes("stage-2") && name.endsWith(".ts"))
  .sort();
const stage2ActivationPlanFiles = [
  "stage2ActivationAuditPlan.ts",
  "stage2ActivationEvidenceValidation.ts",
  "stage2NextActivationAction.ts",
] as const;

const requiredStage2Scripts = [
  "plan:stage2-read-models",
  "plan:stage2-write-handlers",
  "plan:stage2-overview",
  "plan:stage2-live-readiness",
  "plan:stage2-next-action",
  "plan:stage2-activation-audit",
  "check:stage2-activation-evidence",
] as const;

const forbiddenStage2CliPatterns = [
  /from ["']node:fs["']/,
  /from ["']node:child_process["']/,
  /from ["']\.\.\/lib\/server\//,
  /from ["']\.\.\/lib\/server\/mysql\//,
  /loadDotEnvLocal/,
  /closeMysqlPool/,
  /\bdbRows\b/,
  /\bdbExecute\b/,
  /createLiveModuleDatabaseHandlersFromRegistrations/,
  /configuredLiveModuleHandlers\s*=/,
  /writeFileSync|appendFileSync|createWriteStream/,
  /fetch\(/,
  /Start-Process|next dev|next start/,
] as const;

assert.ok(stage2CliFiles.length >= 8);
assert.ok(stage2CliFiles.includes("stage-2-cli-helpers.ts"));
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-cli-safety-checks/);

for (const scriptName of requiredStage2Scripts) {
  const command = packageJson.scripts[scriptName];
  assert.ok(command, `package.json must define ${scriptName}.`);
  assert.match(command, /^jiti scripts\//);
  assert.doesNotMatch(command, /&&|\bnpm\s+run\s+migrate|\bnext\s+(?:dev|start)\b|mysql|prisma|supabase\s+db/);
}

for (const fileName of stage2CliFiles) {
  const source = readFileSync(resolve(scriptDir, fileName), "utf8");
  assert.match(
    source,
    /does not query MySQL|stage-2-cli-helpers|Stage 2 CLI helper checks/,
    `${fileName} must document or centralize read-only CLI behavior.`,
  );

  for (const pattern of forbiddenStage2CliPatterns) {
    assert.doesNotMatch(source, pattern, `${fileName} must stay read-only and local-plan only.`);
  }
}

const allStage2CliSource = stage2CliFiles
  .map((fileName) => readFileSync(resolve(scriptDir, fileName), "utf8"))
  .join("\n");
const allStage2ActivationPlanSource = stage2ActivationPlanFiles
  .map((fileName) => readFileSync(resolve(workspaceDomainDir, fileName), "utf8"))
  .join("\n");

assert.match(allStage2CliSource, /does not register live handlers/);
assert.match(allStage2CliSource, /does not mutate the live registry/);
assert.match(allStage2ActivationPlanSource, /liveRegistrationAllowedFromPlan: false/);
assert.match(allStage2ActivationPlanSource, /liveRegistrationAllowedFromAuditPlan: false/);
assert.match(allStage2ActivationPlanSource, /liveRegistrationAllowedFromEvidence: false/);

console.log("Stage 2 CLI safety checks passed");
