import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const aiFeatureDir = resolve(root, "features/ai-assistant");
const aiDomainDir = resolve(root, "lib/domain/ai-assistant");
const appPrimaryContentSource = readFileSync(resolve(root, "features/app/AppPrimaryContent.tsx"), "utf8");
const appPageShellSource = readFileSync(resolve(root, "features/app/AppPageShell.tsx"), "utf8");
const appScreenPropsSource = readFileSync(resolve(root, "features/app/useAppScreenProps.tsx"), "utf8");
const floatingDockHostSource = readFileSync(resolve(root, "features/app/AiAssistantFloatingDockHost.tsx"), "utf8");
const floatingDockSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantFloatingDock.tsx"), "utf8");
const floatingChatSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantFloatingChat.tsx"), "utf8");
const floatingNotificationsSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantFloatingNotifications.tsx"), "utf8");
const lazyPrimaryContentSource = readFileSync(resolve(root, "features/app/lazyPrimaryContent.tsx"), "utf8");
const tabsSource = readFileSync(resolve(root, "lib/domain/navigation/tabs.ts"), "utf8");
const envExampleSource = readFileSync(resolve(root, ".env.example"), "utf8");
const aiTypesSource = readFileSync(resolve(root, "lib/domain/ai-assistant/types.ts"), "utf8");
const aiStatusSource = readFileSync(resolve(root, "lib/domain/ai-assistant/status.ts"), "utf8");
const aiSectionSource = readFileSync(resolve(root, "features/ai-assistant/AiAssistantSection.tsx"), "utf8");
const aiTabsSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantTabs.tsx"), "utf8");
const aiTasksPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantTasksPanel.tsx"), "utf8");
const aiPlannerPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantPlannerPanel.tsx"), "utf8");
const navigationEventsSource = readFileSync(resolve(root, "lib/domain/navigation/appNavigationEvents.ts"), "utf8");

const aiFeatureSources = collectSourceFiles(aiFeatureDir).map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));
const aiDomainSources = collectSourceFiles(aiDomainDir).map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));

assert.match(tabsSource, /\|\s*"ai-assistant"/);
assert.match(tabsSource, /\{\s*id: "ai-assistant", label: "AI-ассистент", visible: true\s*\}/);
assert.match(lazyPrimaryContentSource, /export const AiAssistantPrimaryContent = dynamic\(/);
assert.match(lazyPrimaryContentSource, /import\("\.\/AiAssistantPrimaryContent"\)/);
assert.match(lazyPrimaryContentSource, /ssr: false/);
assert.match(appPrimaryContentSource, /renderedTopTab === "ai-assistant"/);
assert.match(appPrimaryContentSource, /<AiAssistantPrimaryContent \/>/);
assert.match(aiTypesSource, /\|\s*"tasks"/);
assert.match(aiTypesSource, /\|\s*"planner"/);
assert.doesNotMatch(aiTypesSource, /\|\s*"approvals"/);
assert.doesNotMatch(aiTypesSource, /\|\s*"notifications"/);
assert.match(aiTypesSource, /export type AiAssistantApprovalAction/);
assert.match(aiTypesSource, /export type AiAssistantPlannerItem/);
assert.match(aiSectionSource, /<AiAssistantTasksPanel/);
assert.match(aiSectionSource, /approvals=\{viewModel\.approvalActions\}/);
assert.match(aiSectionSource, /currentWorkDate=\{viewModel\.currentWorkDate\}/);
assert.match(aiSectionSource, /tasks=\{viewModel\.currentTasks\}/);
assert.match(aiSectionSource, /notifications=\{viewModel\.currentNotifications\}/);
assert.match(aiSectionSource, /<AiAssistantPlannerPanel/);
assert.match(aiSectionSource, /plannerItems=\{viewModel\.plannerItems\}/);
assert.doesNotMatch(aiSectionSource, /evidenceById=\{viewModel\.evidenceById\}/);
assert.doesNotMatch(aiTasksPanelSource, />Основание</);
assert.doesNotMatch(aiTasksPanelSource, />Ответственный</);
assert.doesNotMatch(aiTasksPanelSource, /TasksBlock title="Уведомления"/);
assert.doesNotMatch(aiTasksPanelSource, /setTaskRowsState/);
assert.match(aiTasksPanelSource, /createCurrentQueueRows/);
assert.match(aiTasksPanelSource, /onSetApprovalDecision/);
assert.match(aiTasksPanelSource, />Текст</);
assert.match(aiTasksPanelSource, />Решение</);
assert.doesNotMatch(aiTasksPanelSource, /Текст \/ решение/);
assert.doesNotMatch(aiTasksPanelSource, />Выполнение</);
assert.doesNotMatch(aiTasksPanelSource, /Подтвердить выполнение/);
assert.doesNotMatch(aiTasksPanelSource, /placeholder="Комментарий"/);
assert.match(aiTasksPanelSource, /label="Согласовать"/);
assert.match(aiTasksPanelSource, /label="Отказать"/);
assert.match(aiTasksPanelSource, /label="Редактировать"/);
assert.match(aiPlannerPanelSource, /Планировщик/);
assert.match(aiPlannerPanelSource, /plannedDate/);
assert.match(aiPlannerPanelSource, /label="Добавить задачу"/);
assert.match(aiPlannerPanelSource, />Кому \/ канал</);
assert.match(aiPlannerPanelSource, />Выполнение</);
assert.match(aiPlannerPanelSource, /aria-label="Текст выполнения"/);
assert.match(aiPlannerPanelSource, /Согласовать перед выполнением/);
assert.match(aiPlannerPanelSource, /formatActionType/);
assert.doesNotMatch(aiPlannerPanelSource, />Ответственный</);
assert.match(aiPlannerPanelSource, /label="Редактировать задачу"/);
assert.match(aiPlannerPanelSource, /label="Удалить задачу"/);
assert.match(aiPlannerPanelSource, /target: ""/);
assert.match(aiPlannerPanelSource, /plannerDateEditTdStyle/);
assert.match(aiPlannerPanelSource, /plannerRecipientEditTdStyle/);
assert.match(aiStatusSource, /getAiAssistantTaskStatusForApprovalDecision/);
assert.doesNotMatch(aiTabsSource, /\{ id: "chat", label: "Чат" \}/);
assert.doesNotMatch(aiTabsSource, /\{ id: "approvals"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "notifications"/);
assert.match(aiTabsSource, /\{ id: "tasks", label: "Задачи" \}/);
assert.match(aiTabsSource, /\{ id: "planner", label: "Планировщик" \}/);
assert.match(appPageShellSource, /<AiAssistantFloatingDockHost \/>/);
assert.match(appPageShellSource, /\.ai-floating-dock/);
assert.match(floatingDockHostSource, /dynamic\(/);
assert.match(floatingDockHostSource, /AiAssistantFloatingDock/);
assert.match(floatingDockSource, /AiAssistantFloatingNotifications/);
assert.match(floatingDockSource, /AiAssistantFloatingChat/);
assert.match(floatingDockSource, /openWidget/);
assert.match(floatingDockSource, /openWidget === "notifications"/);
assert.match(floatingDockSource, /openWidget === "chat"/);
assert.match(floatingDockSource, /toggleWidget\("notifications"\)/);
assert.match(floatingDockSource, /toggleWidget\("chat"\)/);
assert.match(floatingDockSource, /isNotificationsOpen \? "Уведомления" : "AI-ассистент"/);
assert.match(floatingDockSource, /position: "fixed"/);
assert.match(floatingDockSource, /right: 18/);
assert.match(floatingDockSource, /bottom: 18/);
assert.match(floatingDockSource, /floatingPanelStyle/);
assert.doesNotMatch(floatingChatSource, /position: "fixed"/);
assert.doesNotMatch(floatingChatSource, /onOpenChange/);
assert.match(floatingNotificationsSource, /className="ai-floating-notifications"/);
assert.match(floatingNotificationsSource, /notifications: AiAssistantNotification\[\]/);
assert.match(floatingNotificationsSource, /onNavigate/);
assert.doesNotMatch(floatingNotificationsSource, /position: "absolute"/);
assert.doesNotMatch(floatingNotificationsSource, /aiAssistantApprovalLabels/);
assert.doesNotMatch(floatingNotificationsSource, /Согласование/);
assert.match(floatingNotificationsSource, /appNavigationEventName/);
assert.match(floatingNotificationsSource, /topTab: "ai-assistant"/);
assert.match(floatingNotificationsSource, /aiAssistantTab: "tasks"/);
assert.match(appScreenPropsSource, /addEventListener\(appNavigationEventName/);
assert.match(aiSectionSource, /addEventListener\(appNavigationEventName/);
assert.match(navigationEventsSource, /appNavigationEventName/);

for (const { file, source } of aiFeatureSources) {
  assert.doesNotMatch(source, /NEXT_PUBLIC_[A-Z0-9_]*AI/i, `${file} must not expose AI keys as public env`);
  assert.doesNotMatch(source, /process\.env\.OPENAI_API_KEY/, `${file} must not read local tooling key`);
  assert.doesNotMatch(source, /fetch\(\s*["']https:\/\/api\.openai\.com/i, `${file} must not call AI provider directly`);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/, `${file} must not render unsafe assistant text`);
  assert.doesNotMatch(source, /features\/admin\/ai/, `${file} must not couple product tab to admin sketch`);
}

for (const { file, source } of aiDomainSources) {
  assert.doesNotMatch(source, /\bReact\b|from "react"|from 'react'/, `${file} must stay React-free`);
  assert.doesNotMatch(source, /fetch\(/, `${file} must stay provider-free`);
}

[
  "AI_ASSISTANT_PROVIDER=",
  "AI_ASSISTANT_MODEL=",
  "AI_ASSISTANT_API_KEY=",
  "WHATSAPP_API_TOKEN=",
  "DOCUMENTOLOG_CLIENT_SECRET=",
  "MAIL_SMTP_PASSWORD=",
  "CALENDAR_CLIENT_SECRET=",
  "KNOWLEDGE_INDEX_API_KEY=",
].forEach((name) => {
  assert.match(envExampleSource, new RegExp(`^${escapeRegExp(name)}`, "m"));
});

assert.doesNotMatch(envExampleSource, /^NEXT_PUBLIC_.*AI.*=/m);

console.log("AI assistant source checks passed");

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(name) ? [fullPath] : [];
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
