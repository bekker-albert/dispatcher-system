import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const aiWorkspacePanelSource = readJoinedSources([
  resolve(root, "features/ai-assistant/components/AiAssistantWorkspacePanel.tsx"),
  ...collectSourceFiles(resolve(root, "features/ai-assistant/components/workspace")),
]);

assert.match(aiWorkspacePanelSource, /Черновики/);
assert.match(aiWorkspacePanelSource, /Редактировать/);
assert.match(aiWorkspacePanelSource, /Сохранить локально/);
assert.match(aiWorkspacePanelSource, /Скачать/);
assert.match(aiWorkspacePanelSource, /Предпросмотр/);
assert.match(aiWorkspacePanelSource, /window\.confirm/);
assert.match(aiWorkspacePanelSource, /Пометить для согласования/);
assert.match(aiWorkspacePanelSource, /downloadDraft/);
assert.match(aiWorkspacePanelSource, /requestApproval/);
assert.match(aiWorkspacePanelSource, /const \[savedBodies, setSavedBodies\] = useState<Record<string, string>>\(\{\}\)/);
assert.match(aiWorkspacePanelSource, /const \[editingBody, setEditingBody\] = useState\(""\)/);
assert.match(aiWorkspacePanelSource, /const hasSessionOnlyDrafts = Object\.keys\(savedBodies\)\.length > 0/);
assert.match(aiWorkspacePanelSource, /window\.addEventListener\("beforeunload", warnBeforeUnload\)/);
assert.match(aiWorkspacePanelSource, /const cancelEdit = \(\) =>/);
assert.match(aiWorkspacePanelSource, /hasUnsavedChanges && !window\.confirm/);
assert.doesNotMatch(aiWorkspacePanelSource, /editedBodies\[selectedDraft\.id\] \?\? selectedDraft\.body/);

console.log("AI assistant workspace checks passed");

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
