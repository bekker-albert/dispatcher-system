import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(resolve(testDir, "..", "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const workspacesDoc = readFileSync(resolve(testDir, "..", "docs", "WORKSPACES_ARCHITECTURE.md"), "utf8");
const localSmokeSource = readFileSync(resolve(testDir, "..", "scripts", "local-smoke.mjs"), "utf8");

const requiredDomainGroups = [
  "check:ai-assistant",
  "check:app-shell",
  "check:dispatch-architecture",
  "check:workspaces",
  "check:dispatch-modules",
  "check:data-access",
  "check:legacy-domain",
] as const;

const domainScript = packageJson.scripts["check:domain"];

assert.ok(domainScript, "package.json must define check:domain.");
assert.match(domainScript, /^jiti tests\/domain-checks\.ts && npm run check:ai-assistant/);

for (const groupName of requiredDomainGroups) {
  assert.ok(packageJson.scripts[groupName], `package.json must define ${groupName}.`);
  assert.match(domainScript, new RegExp(`npm run ${groupName}`), `check:domain must call ${groupName}.`);
}

assert.equal(
  (domainScript.match(/jiti tests\//g) ?? []).length,
  1,
  "check:domain must stay a coordinator and avoid growing a long inline test list.",
);
assert.ok(
  domainScript.length <= 260,
  "check:domain must stay short enough to be scanned during safe maintenance.",
);

const workspaceScript = packageJson.scripts["check:workspaces"];
assert.match(workspaceScript, /workspace-ui-source-checks\.ts/);
assert.match(workspaceScript, /workspace-text-source-checks\.ts/);
assert.match(workspaceScript, /workspace-guardrails-checks\.ts/);
assert.doesNotMatch(domainScript, /workspace-ui-source-checks|workspace-guardrails-checks/);

const dataAccessScript = packageJson.scripts["check:data-access"];
assert.match(dataAccessScript, /data-access-query-policy-checks\.ts/);
assert.match(dataAccessScript, /module-list-query-plans-checks\.ts/);
assert.match(dataAccessScript, /read-model-schema-cli-checks\.ts/);
assert.match(dataAccessScript, /read-model-schema-plan-cli-checks\.ts/);
assert.match(dataAccessScript, /live-handler-activation-packet-cli-checks\.ts/);
assert.match(dataAccessScript, /live-handler-registration-review-checks\.ts/);
assert.match(dataAccessScript, /write-read-model-live-prerequisites-checks\.ts/);
assert.match(dataAccessScript, /write-handler-activation-packet-cli-checks\.ts/);
assert.match(dataAccessScript, /module-patch-mutation-plans-checks\.ts/);
assert.match(dataAccessScript, /module-handler-runtime-contracts-checks\.ts/);
assert.match(dataAccessScript, /persistence-contracts-checks\.ts/);
assert.match(packageJson.scripts["check:dispatch-architecture"], /stage-2-write-handler-activation-cli-checks\.ts/);

assert.equal(
  packageJson.scripts["check:read-model-schema"],
  "jiti scripts/check-read-model-schema-readiness.ts",
);
assert.equal(
  packageJson.scripts["plan:stage2-read-models"],
  "jiti scripts/plan-stage-2-read-model-activation.ts",
);
assert.equal(
  packageJson.scripts["plan:stage2-write-handlers"],
  "jiti scripts/plan-stage-2-write-handler-activation.ts",
);
assert.equal(
  packageJson.scripts["plan:stage2-overview"],
  "jiti scripts/plan-stage-2-activation-overview.ts",
);
assert.equal(
  packageJson.scripts["plan:read-model-schema"],
  "jiti scripts/plan-read-model-schema.ts",
);
assert.equal(
  packageJson.scripts["plan:live-handler-activation"],
  "jiti scripts/plan-live-handler-activation-packet.ts",
);
assert.equal(
  packageJson.scripts["plan:write-handler-activation"],
  "jiti scripts/plan-write-handler-activation-packet.ts",
);
assert.equal(
  packageJson.scripts["review:live-handler"],
  "jiti scripts/review-live-handler-activation.ts",
);
assert.equal(
  packageJson.scripts["review:write-handler"],
  "jiti scripts/review-write-handler-registration.ts",
);
assert.equal(
  packageJson.scripts["smoke:local"],
  "node scripts/local-smoke.mjs",
);
assert.equal(
  packageJson.scripts["smoke:production"],
  "node scripts/production-smoke.mjs",
);

assert.match(localSmokeSource, /LOCAL_SMOKE_URL/);
assert.match(localSmokeSource, /http:\/\/127\.0\.0\.1:3000/);
assert.match(localSmokeSource, /method: "HEAD"/);
assert.match(localSmokeSource, /home health: OK/);
assert.match(localSmokeSource, /lang="ru"/);
assert.match(localSmokeSource, /Application error/);
assert.match(localSmokeSource, /Internal Server Error/);
assert.match(localSmokeSource, /Local smoke failed/);
assert.match(localSmokeSource, /one Next\.js dev server is listening/);
assert.match(localSmokeSource, /AUTH_REQUIRED=false npm run dev -- --hostname 127\.0\.0\.1 --port 3000/);
assert.match(localSmokeSource, /resource: "taxation"/);
assert.match(localSmokeSource, /action: "list-waybills"/);
assert.match(localSmokeSource, /response\.status === 501/);
assert.match(localSmokeSource, /planned_module_database_action/);
assert.match(localSmokeSource, /planned-only/);
assert.match(localSmokeSource, /serverPaginated/);
assert.match(localSmokeSource, /noClientFullScan/);
assert.doesNotMatch(localSmokeSource, /method: "(PUT|PATCH|DELETE)"/);
assert.doesNotMatch(localSmokeSource, /vehicles",\s*action: "load"/);
assert.doesNotMatch(localSmokeSource, /PRODUCTION_SMOKE_AUTH/);

assert.match(workspacesDoc, /Verification groups/);
assert.match(workspacesDoc, /`check:domain` stays a coordinator/);
assert.match(workspacesDoc, /`check:workspaces`/);
assert.match(workspacesDoc, /`check:data-access`/);
assert.match(workspacesDoc, /Do not append many `jiti tests\/\.\.\.` entries directly to/);

console.log("Check scripts architecture checks passed");
