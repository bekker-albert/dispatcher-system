import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const mojibakePair = /[\u0420\u0421][\u00a0-\u00bf\u0400-\u045f\u2018-\u201d]/;
const mojibakePattern = new RegExp(`(?:${mojibakePair.source}){2,}|\\uFFFD`);

const workspaceTextSources = [
  "../docs/CURRENT_ARCHITECTURE_AUDIT.md",
  "../docs/DISPATCH_SERVICE_ARCHITECTURE.md",
  "../docs/EDITING_AND_CONFLICTS.md",
  "../docs/PERFORMANCE_2GB_RAM.md",
  "../docs/WORKSPACES_ARCHITECTURE.md",
  "../features/app/lazyPrimaryContent.tsx",
  "../features/fuel/FuelSection.tsx",
  "../features/safety-driving/SafetySection.tsx",
  "../lib/domain/workspaces/workspaces.ts",
  "../lib/domain/workspaces/moduleCatalog.ts",
  "../lib/domain/workspaces/readiness.ts",
  "../lib/domain/access-control/accessMatrix.ts",
  "../features/workspaces/WorkspaceOverviewSection.tsx",
  "../features/workspaces/CommonProcessesSection.tsx",
  "../features/admin/access/AdminAccessMatrixSection.tsx",
];

const mojibakeSample = "\u0420\u201c\u0420\u00bb\u0420\u00b0\u0420\u0406\u0420\u0405\u0420\u00b0\u0421\u040f";
const readableSample = "\u0413\u043b\u0430\u0432\u043d\u0430\u044f";
assert.match(mojibakeSample, mojibakePattern);
assert.doesNotMatch(readableSample, mojibakePattern);

for (const relativePath of workspaceTextSources) {
  const source = readFileSync(resolve(testDir, relativePath), "utf8");
  assert.doesNotMatch(source, mojibakePattern, `${relativePath} contains mojibake-like UI text.`);
}

console.log("Workspace text source checks passed");
