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
const aiTypesFacadeSource = readFileSync(resolve(root, "lib/domain/ai-assistant/types.ts"), "utf8");
const aiTypesSource = readJoinedSources([
  resolve(root, "lib/domain/ai-assistant/types.ts"),
  ...collectSourceFiles(resolve(root, "lib/domain/ai-assistant/types")),
]);
const aiStatusSource = readFileSync(resolve(root, "lib/domain/ai-assistant/status.ts"), "utf8");
const aiSectionSource = readFileSync(resolve(root, "features/ai-assistant/AiAssistantSection.tsx"), "utf8");
const aiTabsSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantTabs.tsx"), "utf8");
const aiChatMockSource = readFileSync(resolve(root, "features/ai-assistant/mock/chat.mock.ts"), "utf8");
const aiTasksPanelSource = readJoinedSources([
  resolve(root, "features/ai-assistant/components/AiAssistantTasksPanel.tsx"),
  ...collectSourceFiles(resolve(root, "features/ai-assistant/components/tasks")),
]);
const aiPlannerPanelSource = readJoinedSources([
  resolve(root, "features/ai-assistant/components/AiAssistantPlannerPanel.tsx"),
  ...collectSourceFiles(resolve(root, "features/ai-assistant/components/planner")),
]);
const aiAgentsPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantAgentsPanel.tsx"), "utf8");
const aiDevelopmentPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantDevelopmentPanel.tsx"), "utf8");
const aiKnowledgePanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantKnowledgePanel.tsx"), "utf8");
const aiIntegrationPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantIntegrationStatus.tsx"), "utf8");
const aiStateSource = readFileSync(resolve(root, "features/ai-assistant/lib/useAiAssistantState.tsx"), "utf8");
const navigationEventsSource = readFileSync(resolve(root, "lib/domain/navigation/appNavigationEvents.ts"), "utf8");
const approvalPolicySource = readFileSync(resolve(root, "lib/domain/ai-assistant/approval-policy.ts"), "utf8");
const domainConnectorsDir = resolve(root, "lib/domain/ai-assistant/connectors");

const aiFeatureSources = collectSourceFiles(aiFeatureDir).map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));
const aiDomainSources = collectSourceFiles(aiDomainDir).map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));

assert.match(tabsSource, /\|\s*"ai-assistant"/);
assert.match(tabsSource, /\{\s*id: "ai-assistant"/);
assert.match(lazyPrimaryContentSource, /export const AiAssistantPrimaryContent = dynamic\(/);
assert.match(lazyPrimaryContentSource, /import\("\.\/AiAssistantPrimaryContent"\)/);
assert.match(lazyPrimaryContentSource, /ssr: false/);
assert.match(appPrimaryContentSource, /renderedTopTab === "ai-assistant"/);
assert.match(appPrimaryContentSource, /<AiAssistantPrimaryContent \/>/);
assert.match(aiTypesSource, /\|\s*"tasks"/);
assert.match(aiTypesSource, /\|\s*"planner"/);
assert.match(aiTypesSource, /\|\s*"agents"/);
assert.match(aiTypesSource, /\|\s*"development"/);
assert.doesNotMatch(aiTypesSource, /\|\s*"approvals"/);
assert.doesNotMatch(aiTypesSource, /\|\s*"notifications"/);
assert.match(aiTypesSource, /export type AiAssistantApprovalAction/);
assert.match(aiTypesSource, /export type AiAssistantPlannerItem/);
assert.match(aiTypesSource, /export type AiAssistantAgentRole/);
assert.match(aiTypesSource, /export type AiAssistantWhatsAppMessageCandidate/);
assert.match(aiTypesSource, /export type AiAssistantDocumentologItem/);
assert.match(aiTypesSource, /export type AiAssistantDevelopmentIdea/);
assert.match(aiTypesSource, /export type AiAssistantCodexPromptDraft/);
assert.match(aiTypesSource, /export type AiAssistantRecurrenceRule/);
assert.match(aiTypesSource, /key: string/);
assert.match(aiTypesFacadeSource, /export type \* from "\.\/types\/index"/);

assert.match(aiSectionSource, /<AiAssistantTasksPanel/);
assert.match(aiSectionSource, /approvals=\{viewModel\.approvalActions\}/);
assert.match(aiSectionSource, /currentWorkDate=\{viewModel\.currentWorkDate\}/);
assert.match(aiSectionSource, /tasks=\{viewModel\.currentTasks\}/);
assert.match(aiSectionSource, /notifications=\{viewModel\.currentNotifications\}/);
assert.match(aiSectionSource, /plannerItems=\{viewModel\.plannerItems\}/);
assert.match(aiSectionSource, /<AiAssistantPlannerPanel/);
assert.match(aiSectionSource, /<AiAssistantAgentsPanel/);
assert.match(aiSectionSource, /<AiAssistantDevelopmentPanel/);
assert.match(aiSectionSource, /onAddIntegration=\{addIntegration\}/);
assert.match(aiSectionSource, /onAddSource=\{addKnowledgeSource\}/);
assert.doesNotMatch(aiSectionSource, /evidenceById=\{viewModel\.evidenceById\}/);
assert.match(aiChatMockSource, /вкладку Задачи/);
assert.doesNotMatch(aiChatMockSource, /Одобрения/);

assert.doesNotMatch(aiTasksPanelSource, />Основание</);
assert.doesNotMatch(aiTasksPanelSource, />Ответственный</);
assert.doesNotMatch(aiTasksPanelSource, /TasksBlock title="Уведомления"/);
assert.doesNotMatch(aiTasksPanelSource, /setTaskRowsState/);
assert.match(aiTasksPanelSource, /createCurrentQueueRows/);
assert.match(aiTasksPanelSource, /onSetApprovalDecision/);
assert.match(aiTasksPanelSource, /plannerItems: AiAssistantPlannerItem\[\]/);
assert.match(aiTasksPanelSource, /Планировщик:/);
assert.match(aiTasksPanelSource, />Текст</);
assert.match(aiTasksPanelSource, />Решение</);
assert.doesNotMatch(aiTasksPanelSource, /Текст \/ решение/);
assert.doesNotMatch(aiTasksPanelSource, />Выполнение</);
assert.doesNotMatch(aiTasksPanelSource, /Подтвердить выполнение/);
assert.doesNotMatch(aiTasksPanelSource, /placeholder="Комментарий"/);
assert.match(aiTasksPanelSource, /label="Согласовать"/);
assert.match(aiTasksPanelSource, /label="Отказать"/);
assert.match(aiTasksPanelSource, /label="Редактировать"/);
assert.match(aiTasksPanelSource, /Требуют моего решения/);
assert.match(aiTasksPanelSource, /Текущие задачи/);
assert.match(aiTasksPanelSource, /Черновики и подготовленные действия/);
assert.match(aiTasksPanelSource, /label="Вернуть на доработку"/);

assert.match(aiPlannerPanelSource, /Планировщик/);
assert.match(aiPlannerPanelSource, /plannedDate/);
assert.match(aiPlannerPanelSource, /aria-label="Повтор"/);
assert.match(aiPlannerPanelSource, /formatPlannerRecurrence/);
assert.match(aiPlannerPanelSource, /window\.confirm/);
assert.match(aiPlannerPanelSource, /label="Добавить задачу"/);
assert.match(aiPlannerPanelSource, />Кому \/ канал</);
assert.match(aiPlannerPanelSource, />Выполнение</);
assert.match(aiPlannerPanelSource, /aria-label="Текст выполнения"/);
assert.match(aiPlannerPanelSource, /Согласовать перед выполнением/);
assert.match(aiPlannerPanelSource, /formatPlannerActionType/);
assert.doesNotMatch(aiPlannerPanelSource, />Ответственный</);
assert.match(aiPlannerPanelSource, /label="Редактировать задачу"/);
assert.match(aiPlannerPanelSource, /label="Удалить задачу"/);
assert.match(aiPlannerPanelSource, /target: ""/);
assert.match(aiPlannerPanelSource, /plannerDateEditTdStyle/);
assert.match(aiPlannerPanelSource, /plannerRecipientEditTdStyle/);
assert.match(aiStatusSource, /getAiAssistantTaskStatusForApprovalDecision/);

assert.doesNotMatch(aiTabsSource, /\{ id: "chat"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "approvals"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "notifications"/);
assert.match(aiTabsSource, /\{ id: "tasks"/);
assert.match(aiTabsSource, /\{ id: "planner"/);
assert.match(aiTabsSource, /\{ id: "agents"/);
assert.match(aiTabsSource, /\{ id: "development"/);

assert.match(aiAgentsPanelSource, /Внутренние роли одного AI-модуля/);
assert.match(aiAgentsPanelSource, /requiresUserApproval/);
assert.match(aiDevelopmentPanelSource, /Сформировать ТЗ/);
assert.match(aiDevelopmentPanelSource, /Сформировать промт для Codex/);
assert.match(aiDevelopmentPanelSource, /onCreateCodexPromptDraft/);

assert.match(appPageShellSource, /<AiAssistantFloatingDockHost \/>/);
assert.match(appPageShellSource, /\.ai-floating-dock/);
assert.match(floatingDockHostSource, /dynamic\(/);
assert.match(floatingDockHostSource, /AiAssistantFloatingDock/);
assert.match(floatingDockSource, /AiAssistantFloatingNotifications/);
assert.match(floatingDockSource, /AiAssistantFloatingChat/);
assert.match(floatingDockSource, /activePanel/);
assert.match(floatingDockSource, /setActivePanel\("notifications"\)/);
assert.match(floatingDockSource, /setActivePanel\("chat"\)/);
assert.match(floatingDockSource, /isNotificationsOpen \? "Уведомления" : "AI-ассистент"/);
assert.doesNotMatch(floatingDockSource, /toggleWidget/);
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

assert.match(aiKnowledgePanelSource, /onAddSource/);
assert.match(aiKnowledgePanelSource, /onUpdateSource/);
assert.match(aiKnowledgePanelSource, /onDeleteSource/);
assert.match(aiKnowledgePanelSource, /label="Добавить источник"/);
assert.match(aiIntegrationPanelSource, /onAddIntegration/);
assert.match(aiIntegrationPanelSource, /onUpdateIntegration/);
assert.match(aiIntegrationPanelSource, /onDeleteIntegration/);
assert.match(aiIntegrationPanelSource, /label="Добавить интеграцию"/);
assert.match(aiIntegrationPanelSource, />Возможности</);
assert.match(aiIntegrationPanelSource, />Заглушка</);
assert.match(aiIntegrationPanelSource, />Следующий шаг</);
assert.match(aiStateSource, /setKnowledgeSources/);
assert.match(aiStateSource, /setIntegrations/);
assert.match(aiStateSource, /setDevelopmentIdeas/);
assert.match(aiStateSource, /createCodexPromptDraftForIdea/);
assert.match(aiStateSource, /item\.linkedTaskId === approval\.taskId/);
assert.match(approvalPolicySource, /requiresAiAssistantApproval/);
assert.match(approvalPolicySource, /send-whatsapp/);
assert.match(approvalPolicySource, /delete-data/);

[
  "ai-api-connector.ts",
  "whatsapp-connector.ts",
  "mail-connector.ts",
  "calendar-connector.ts",
  "documentolog-connector.ts",
  "notification-connector.ts",
  "knowledge-base-connector.ts",
].forEach((fileName) => {
  const source = readFileSync(resolve(domainConnectorsDir, fileName), "utf8");
  assert.match(source, /dry-run|Dry-run|dryRun|backend|сервер|backend\/API/i, `${fileName} must document dry-run backend boundary`);
  assert.doesNotMatch(source, /fetch\(/, `${fileName} must not call external API`);
  assert.doesNotMatch(source, /OPENAI_API_KEY|WHATSAPP_API_TOKEN|CLIENT_SECRET|PASSWORD/, `${fileName} must not contain secret names`);
});

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

function readJoinedSources(files: string[]) {
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
