import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const performanceDoc = readFileSync(resolve(root, "docs", "PERFORMANCE_2GB_RAM.md"), "utf8");

const scripts = packageJson.scripts;

assert.equal(scripts.dev, "next dev --turbopack");
assert.equal(scripts.build, "next build");
assert.equal(scripts.start, "next start");
assert.equal(
  scripts.verify,
  "npm run lint && npm run typecheck && npm run build && npm run check:domain && npm run check:project",
);

const protectedScriptNames = Object.keys(scripts)
  .filter((name) => (
    name === "dev"
    || name === "build"
    || name === "start"
    || name === "verify"
    || name === "release:check"
    || name.startsWith("check:")
  ))
  .sort();

const forbiddenProtectedScriptPatterns = [
  /\bnpm\s+run\s+migrate:/,
  /\b(?:node|jiti|tsx|ts-node)\s+scripts\/migrate/,
  /\bprisma\s+(?:migrate|db\s+push)/,
  /\bsupabase\s+db\b/,
  /\bmysql\s+(?:-|--|[A-Za-z0-9_])/,
  /\bnext\s+start\s+&&/,
  /&&\s*next\s+start\b/,
  /\bnext\s+dev\s+&&/,
  /&&\s*next\s+dev\b/,
  /\bpm2\b/,
  /\bforever\b/,
  /\bnodemon\b/,
  /\bconcurrently\b/,
  /\bwait-on\b/,
] as const;

const protectedScriptViolations = protectedScriptNames.flatMap((name) => {
  const command = scripts[name] ?? "";
  return forbiddenProtectedScriptPatterns.flatMap((pattern) => (
    pattern.test(command)
      ? [{ name, command, pattern: String(pattern) }]
      : []
  ));
});

assert.deepEqual(
  protectedScriptViolations,
  [],
  "Protected scripts must not run migrations, database CLIs, permanent servers, or multi-process orchestration.",
);

assert.equal(
  scripts["migrate:supabase-to-mysql"],
  "jiti scripts/migrate-supabase-to-mysql.ts",
  "The Supabase to MySQL migration must remain a manual script, not part of verify/build/start.",
);

for (const name of protectedScriptNames) {
  const command = scripts[name] ?? "";
  assert.doesNotMatch(
    command,
    /migrate:supabase-to-mysql/,
    `${name} must not call the manual migration script.`,
  );
}

assert.ok(scripts["plan:stage2-read-models"].startsWith("jiti scripts/plan-"));
assert.ok(scripts["plan:stage2-write-handlers"].startsWith("jiti scripts/plan-"));
assert.ok(scripts["plan:read-model-schema"].startsWith("jiti scripts/plan-"));
assert.ok(scripts["plan:live-handler-activation"].startsWith("jiti scripts/plan-"));
assert.ok(scripts["plan:write-handler-activation"].startsWith("jiti scripts/plan-"));
assert.ok(scripts["review:live-handler"].startsWith("jiti scripts/review-"));
assert.ok(scripts["review:write-handler"].startsWith("jiti scripts/review-"));
assert.doesNotMatch(scripts["plan:read-model-schema"], /migrate|apply|deploy|start/i);
assert.doesNotMatch(scripts["plan:stage2-write-handlers"], /migrate|apply|deploy|start/i);
assert.doesNotMatch(scripts["plan:live-handler-activation"], /migrate|apply|deploy|start/i);
assert.doesNotMatch(scripts["plan:write-handler-activation"], /migrate|apply|deploy|start/i);

assert.match(performanceDoc, /Package script runtime guardrail/);
assert.match(performanceDoc, /tests\/package-script-runtime-guardrails-checks\.ts/);
assert.match(performanceDoc, /`dev`, `build`, `start`, `verify`, `release:check`, and `check:\*` scripts must\s+not run migrations/);
assert.match(performanceDoc, /Migration scripts stay manual/);

console.log("Package script runtime guardrails checks passed");
