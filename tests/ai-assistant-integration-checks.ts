import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createIntegrationDraft,
  formatMode as formatIntegrationMode,
  normalizeIntegrationDraft,
  splitList as splitIntegrationList,
  splitScopes as splitIntegrationScopes,
} from "../features/ai-assistant/components/integrations/integrationModel";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const aiIntegrationPanelSource = readJoinedSources([
  resolve(root, "features/ai-assistant/components/AiAssistantIntegrationStatus.tsx"),
  ...collectSourceFiles(resolve(root, "features/ai-assistant/components/integrations")),
]);

assert.match(aiIntegrationPanelSource, /onAddIntegration/);
assert.match(aiIntegrationPanelSource, /onUpdateIntegration/);
assert.match(aiIntegrationPanelSource, /onDeleteIntegration/);
assert.match(aiIntegrationPanelSource, /label="Добавить интеграцию"/);
assert.match(aiIntegrationPanelSource, />Возможности</);
assert.match(aiIntegrationPanelSource, />Заглушка</);
assert.match(aiIntegrationPanelSource, />Следующий шаг</);
assert.equal(createIntegrationDraft().status, "planned");
assert.equal(formatIntegrationMode("read-write"), "Чтение и запись");
assert.deepEqual(splitIntegrationList("AI API, WhatsApp, "), ["AI API", "WhatsApp"]);
assert.deepEqual(splitIntegrationScopes("ai.chat.read, ai.external.draft, "), ["ai.chat.read", "ai.external.draft"]);
assert.deepEqual(
  normalizeIntegrationDraft({
    title: "  Почта  ",
    status: "planned",
    mode: "read-write",
    description: "  Черновики писем  ",
    requiredScopes: [" ai.chat.read " as never, "" as never],
    availableCapabilities: [" draft ", ""],
    stubNotes: " dry-run ",
    nextStep: " backend API ",
  }),
  {
    title: "Почта",
    status: "planned",
    mode: "read-write",
    description: "Черновики писем",
    requiredScopes: ["ai.chat.read"],
    availableCapabilities: ["draft"],
    stubNotes: "dry-run",
    nextStep: "backend API",
  },
);

console.log("AI assistant integration checks passed");

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(name) ? [fullPath] : [];
  });
}

function readJoinedSources(files: string[]) {
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}
