import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const workspacesDoc = readFileSync(resolve(root, "docs/WORKSPACES_ARCHITECTURE.md"), "utf8");

const lightPlaceholderFiles = [
  "features/workspaces/WorkspaceOverviewSection.tsx",
  "features/workspaces/CommonProcessesSection.tsx",
  "features/admin/access/AdminAccessMatrixSection.tsx",
] as const;

const forbiddenPlaceholderPatterns = [
  /@\/features\/(?:ai-assistant|contractors|dispatch|fleet|fuel|pto|reports|safety-driving)/,
  /@\/lib\/data/,
  /@\/lib\/server/,
  /\/api\/database/,
  /databaseRequest\(/,
  /fetch\(/,
  /dbRows|dbExecute/,
  /useEffect\(/,
  /useState\(/,
  /localStorage|sessionStorage/,
] as const;

function readRepoSource(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function lineCount(source: string) {
  return source.split(/\r?\n/).length;
}

for (const path of lightPlaceholderFiles) {
  const source = readRepoSource(path);
  assert.ok(
    lineCount(source) <= 260,
    `${path} must stay small enough to remain a light stage-1 placeholder/overview screen.`,
  );

  for (const pattern of forbiddenPlaceholderPatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `${path} must not load production data, import heavy legacy modules, or add local business state.`,
    );
  }
}

const overviewSource = readRepoSource("features/workspaces/WorkspaceOverviewSection.tsx");
assert.doesNotMatch(overviewSource, /createWorkspaceReadinessSummary/);
assert.doesNotMatch(overviewSource, /createWorkspaceImplementationRoadmap/);
assert.doesNotMatch(overviewSource, /createWorkspaceHandlerRolloutSummary/);
assert.doesNotMatch(overviewSource, /createStage2FirstReadModelActivationSummary/);
assert.match(overviewSource, /workspace\.performanceRule/);
assert.match(overviewSource, /appNavigationEventName/);
assert.match(overviewSource, /window\.dispatchEvent/);
assert.doesNotMatch(overviewSource, /createStage2FirstReadModelBatch/);
assert.doesNotMatch(overviewSource, /stage2ReadModelActivationChecklist/);

const commonProcessesSource = readRepoSource("features/workspaces/CommonProcessesSection.tsx");
assert.match(commonProcessesSource, /getWorkspaceById\("common-processes"\)/);
assert.doesNotMatch(commonProcessesSource, /onClick=|onSubmit=|window\./);

const adminAccessMatrixSource = readRepoSource("features/admin/access/AdminAccessMatrixSection.tsx");
assert.match(adminAccessMatrixSource, /workspaceAccessMatrixPreview/);
assert.match(adminAccessMatrixSource, /dispatchServiceRoles/);
assert.doesNotMatch(adminAccessMatrixSource, /<form|<button|<input|<select|<textarea|onClick=|onSubmit=/);
assert.doesNotMatch(adminAccessMatrixSource, /createAccessMatrixGrant|createAccessMatrixGrantPatchCommand|createAccessMatrixGrantCreateCommand/);

assert.match(workspacesDoc, /Light placeholder screens/);
assert.match(workspacesDoc, /tests\/workspace-placeholder-guardrails-checks\.ts/);
assert.match(workspacesDoc, /must not call `fetch`/);
assert.match(workspacesDoc, /must not import heavy legacy\s+modules/);
assert.match(workspacesDoc, /must not add\s+`useState` or `useEffect`/);

console.log("Workspace placeholder guardrails checks passed");
