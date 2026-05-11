import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const bundleSource = readFileSync(resolve(root, "features/app/useAppStateBundle.ts"), "utf8");
const workspacesDoc = readFileSync(resolve(root, "docs/WORKSPACES_ARCHITECTURE.md"), "utf8");

function lineCount(source: string) {
  return source.split(/\r?\n/).length;
}

assert.ok(lineCount(bundleSource) <= 160, "useAppStateBundle must stay a compact aggregator.");

assert.match(bundleSource, /export function useAppStateBundle\(\)/);
assert.match(bundleSource, /useAppTabsState/);
assert.match(bundleSource, /useAppDataLoadState/);
assert.match(bundleSource, /usePtoPersistentState/);
assert.match(bundleSource, /useReportUiState/);
assert.match(bundleSource, /useNavigationSelectionHandlers/);

const forbiddenBundlePatterns = [
  /useState\(/,
  /useEffect\(/,
  /useReducer\(/,
  /fetch\(/,
  /databaseRequest\(/,
  /\/api\/database/,
  /@\/lib\/data/,
  /@\/lib\/server/,
  /service-contracts/,
  /moduleCatalog/,
  /workspaceAccessMatrixPreview/,
  /features\/workspaces/,
  /features\/common-processes/,
  /features\/safety-driving/,
  /features\/ai-assistant/,
  /lib\/domain\/(?:taxation|smts|common-processes|reports\/aggregate|access-control|workspaces)/,
] as const;

for (const pattern of forbiddenBundlePatterns) {
  assert.doesNotMatch(
    bundleSource,
    pattern,
    "useAppStateBundle must not become a data loader, workspace host, or future-module business-state container.",
  );
}

const importedHookNames = [...bundleSource.matchAll(/import \{ ([^}]+) \} from/g)]
  .flatMap((match) => match[1]?.split(",") ?? [])
  .map((name) => name.trim())
  .filter((name) => /^use[A-Z]/.test(name));

const returnedSpreadNames = [...bundleSource.matchAll(/\.\.\.([a-zA-Z0-9]+State|[a-zA-Z0-9]+Controls|navigationSelectionHandlers)/g)]
  .map((match) => match[1])
  .filter(Boolean);

assert.ok(importedHookNames.length > 0, "useAppStateBundle should aggregate existing hooks.");
assert.ok(returnedSpreadNames.length >= 12, "useAppStateBundle should remain a spread-only aggregator of existing state slices.");
assert.doesNotMatch(bundleSource, /const \[[^\]]*(?:Rows|Reports|Waybills|Fuel|Gps|Smts|Shifts|Documents|Events)[^\]]*\]\s*=\s*useState/);
assert.doesNotMatch(bundleSource, /return \{[\s\S]*(?:taxation|smts|commonProcesses|workspaceRows|accessMatrixRows)[\s\S]*\};/);

assert.match(workspacesDoc, /App state bundle boundary/);
assert.match(workspacesDoc, /tests\/app-state-bundle-guardrails-checks\.ts/);
assert.match(workspacesDoc, /must not add `useState`, `useEffect`, `fetch`, or\s+`\/api\/database`/);
assert.match(workspacesDoc, /New\s+workspace business state belongs in workspace-level hooks/);

console.log("App state bundle guardrails checks passed");
