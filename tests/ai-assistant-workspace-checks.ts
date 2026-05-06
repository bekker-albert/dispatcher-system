import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const aiSectionSource = readFileSync(resolve(root, "features/ai-assistant/AiAssistantSection.tsx"), "utf8");
const aiWorkspacePanelSource = readJoinedSources([
  resolve(root, "features/ai-assistant/components/AiAssistantWorkspacePanel.tsx"),
  resolve(root, "features/ai-assistant/lib/workspaceSessionState.ts"),
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
assert.match(aiWorkspacePanelSource, /type AiAssistantWorkspaceSessionState/);
assert.match(aiWorkspacePanelSource, /createAiAssistantWorkspaceSessionState/);
assert.match(aiSectionSource, /const \[workspaceSessionState, setWorkspaceSessionState\] = useState/);
assert.match(aiSectionSource, /sessionState=\{workspaceSessionState\}/);
assert.match(aiSectionSource, /onSessionStateChange=\{setWorkspaceSessionState\}/);
assert.match(aiWorkspacePanelSource, /const hasSessionOnlyDrafts = Object\.keys\(savedBodies\)\.length > 0/);
assert.match(aiWorkspacePanelSource, /window\.addEventListener\("beforeunload", warnBeforeUnload\)/);
assert.match(aiWorkspacePanelSource, /event\.returnValue = ""/);
assert.match(aiWorkspacePanelSource, /const cancelEdit = \(\) =>/);
assert.match(aiWorkspacePanelSource, /if \(editingId === selectedDraft\.id\) return/);
assert.match(aiWorkspacePanelSource, /disabled=\{isEditing\}/);
assert.match(aiWorkspacePanelSource, /hasUnsavedChanges && !window\.confirm/);
assert.doesNotMatch(aiWorkspacePanelSource, /editedBodies\[selectedDraft\.id\] \?\? selectedDraft\.body/);
assert.doesNotMatch(aiWorkspacePanelSource, /const \[savedBodies, setSavedBodies\] = useState<Record<string, string>>\(\{\}\)/);
assert.doesNotMatch(aiWorkspacePanelSource, /const \[editingBody, setEditingBody\] = useState\(""\)/);

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
