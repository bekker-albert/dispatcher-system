import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPlannerCalendarDays,
  formatPlannerMonthTitle,
  getPlannerMonthKey,
  shiftPlannerMonth,
} from "../features/ai-assistant/components/planner/plannerCalendarModel";

const testDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDir, "..");
const aiFeatureDir = resolve(root, "features/ai-assistant");
const aiDomainDir = resolve(root, "lib/domain/ai-assistant");
const appRootSource = readFileSync(resolve(root, "features/app/AppRoot.tsx"), "utf8");
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
const aiTaskTypesSource = readFileSync(resolve(root, "lib/domain/ai-assistant/types/tasks.ts"), "utf8");
const aiStatusSource = readFileSync(resolve(root, "lib/domain/ai-assistant/status.ts"), "utf8");
const aiSectionSource = readFileSync(resolve(root, "features/ai-assistant/AiAssistantSection.tsx"), "utf8");
const aiTabsSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantTabs.tsx"), "utf8");
const aiHomePanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantHomePanel.tsx"), "utf8");
const aiDocumentsPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantDocumentsPanel.tsx"), "utf8");
const aiSettingsPanelSource = readFileSync(resolve(root, "features/ai-assistant/components/AiAssistantSettingsPanel.tsx"), "utf8");
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
assert.match(aiTaskTypesSource, /\|\s*"main"/);
assert.match(aiTaskTypesSource, /\|\s*"tasks"/);
assert.match(aiTaskTypesSource, /\|\s*"documents"/);
assert.match(aiTaskTypesSource, /\|\s*"settings"/);
assert.doesNotMatch(aiTaskTypesSource, /\|\s*"planner"/);
assert.doesNotMatch(aiTaskTypesSource, /\|\s*"agents"/);
assert.doesNotMatch(aiTaskTypesSource, /\|\s*"development"/);
assert.doesNotMatch(aiTaskTypesSource, /\|\s*"approvals"/);
assert.doesNotMatch(aiTaskTypesSource, /\|\s*"notifications"/);
assert.match(aiTypesSource, /export type AiAssistantApprovalAction/);
assert.match(aiTypesSource, /\|\s*"returned"/);
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
assert.match(aiSectionSource, /<AiAssistantHomePanel/);
assert.match(aiSectionSource, /<AiAssistantDocumentsPanel/);
assert.match(aiSectionSource, /<AiAssistantSettingsPanel/);
assert.match(aiSectionSource, /const \[settingsSection, setSettingsSection\] = useState<SettingsSection>\("agents"\)/);
assert.match(aiSectionSource, /section=\{settingsSection\}/);
assert.match(aiSectionSource, /onSetSection=\{setSettingsSection\}/);
assert.match(aiSectionSource, /approvals=\{viewModel\.approvalActions\}/);
assert.match(aiSectionSource, /currentWorkDate=\{viewModel\.currentWorkDate\}/);
assert.match(aiSectionSource, /tasks=\{viewModel\.currentTasks\}/);
assert.match(aiSectionSource, /notifications=\{viewModel\.currentNotifications\}/);
assert.match(aiSectionSource, /plannerItems=\{viewModel\.plannerItems\}/);
assert.doesNotMatch(aiSectionSource, /<AiAssistantPlannerPanel/);
assert.doesNotMatch(aiSectionSource, /<AiAssistantAgentsPanel/);
assert.doesNotMatch(aiSectionSource, /<AiAssistantDevelopmentPanel/);
assert.match(aiSettingsPanelSource, /<AiAssistantAgentsPanel/);
assert.match(aiSettingsPanelSource, /<AiAssistantDevelopmentPanel/);
assert.match(aiSettingsPanelSource, /<AiAssistantIntegrationStatus/);
assert.match(aiSettingsPanelSource, /<AiAssistantKnowledgePanel/);
assert.match(aiSettingsPanelSource, /<AiAssistantAuditLog/);
assert.match(aiSettingsPanelSource, /section: SettingsSection/);
assert.match(aiSettingsPanelSource, /onSetSection: \(section: SettingsSection\) => void/);
assert.doesNotMatch(aiSettingsPanelSource, /useState<SettingsSection>/);
assert.match(aiSectionSource, /addIntegration=\{addIntegration\}/);
assert.match(aiSectionSource, /addKnowledgeSource=\{addKnowledgeSource\}/);
assert.doesNotMatch(aiSectionSource, /evidenceById=\{viewModel\.evidenceById\}/);
assert.match(aiHomePanelSource, /Что нужно сделать\?/);
assert.match(aiHomePanelSource, /Подготовить служебку/);
assert.match(aiHomePanelSource, /Требуют решения/);
assert.match(aiHomePanelSource, /Сегодня/);
assert.match(aiHomePanelSource, /Черновики/);
assert.match(aiHomePanelSource, /Последние действия/);
assert.match(aiHomePanelSource, /onOpenSettingsSection/);
assert.match(aiHomePanelSource, /onOpenSettingsSection\("audit"\)/);
assert.match(aiDocumentsPanelSource, /Документы/);
assert.match(aiDocumentsPanelSource, /const isOpen = selectedCardId === card\.id/);
assert.match(aiChatMockSource, /вкладку Задачи/);
assert.doesNotMatch(aiChatMockSource, /Одобрения/);

assert.doesNotMatch(aiTasksPanelSource, />Основание</);
assert.doesNotMatch(aiTasksPanelSource, />Ответственный</);
assert.doesNotMatch(aiTasksPanelSource, /TasksBlock title="Уведомления"/);
assert.doesNotMatch(aiTasksPanelSource, /setTaskRowsState/);
assert.match(aiTasksPanelSource, /createCurrentQueueRows/);
assert.match(aiTasksPanelSource, /onSetApprovalDecision/);
assert.match(aiTasksPanelSource, /plannerItems: AiAssistantPlannerItem\[\]/);
assert.match(aiTasksPanelSource, /<AiAssistantPlannerPanel/);
assert.match(aiTasksPanelSource, /onChangePlannerItems/);
assert.match(aiTasksPanelSource, /Планировщик:/);
assert.match(aiTasksPanelSource, /taskCardsStyle/);
assert.match(aiTasksPanelSource, /taskCardStyle/);
assert.match(aiTasksPanelSource, /hasQueueRows/);
assert.match(aiTasksPanelSource, /return null/);
assert.match(aiTasksPanelSource, /createStatusQueueSections/);
assert.match(aiTasksPanelSource, /filterQueueRows/);
assert.match(aiTasksPanelSource, /createTaskStatusSummary/);
assert.match(aiTasksPanelSource, /taskStatusFilterOptions/);
assert.match(aiTasksPanelSource, /Поиск по задачам/);
assert.match(aiTasksPanelSource, /Фильтр по статусу/);
assert.match(aiTasksPanelSource, /Статусный журнал задач/);
assert.doesNotMatch(aiTasksPanelSource, /Текст \/ решение/);
assert.doesNotMatch(aiTasksPanelSource, />Выполнение</);
assert.doesNotMatch(aiTasksPanelSource, /Подтвердить выполнение/);
assert.doesNotMatch(aiTasksPanelSource, /placeholder="Комментарий"/);
assert.match(aiTasksPanelSource, /label="Согласовать"/);
assert.match(aiTasksPanelSource, /label="Отказать"/);
assert.match(aiTasksPanelSource, /label="Редактировать"/);
assert.doesNotMatch(aiTasksPanelSource, /Требуют моего решения/);
assert.doesNotMatch(aiTasksPanelSource, /Текущие задачи/);
assert.doesNotMatch(aiTasksPanelSource, /Черновики и подготовленные действия/);
assert.match(aiTasksPanelSource, /label="Вернуть на доработку"/);

assert.match(aiPlannerPanelSource, /Планировщик/);
assert.match(aiPlannerPanelSource, /plannedDate/);
assert.match(aiPlannerPanelSource, /PlannerCalendar/);
assert.match(aiPlannerPanelSource, /PlannerDayTasks/);
assert.match(aiPlannerPanelSource, /createPlannerCalendarDays/);
assert.match(aiPlannerPanelSource, /selectedDate/);
assert.match(aiPlannerPanelSource, /setPlannerDecision/);
assert.match(aiPlannerPanelSource, /taskCount/);
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
assert.equal(getPlannerMonthKey("2026-04-24"), "2026-04");
assert.equal(shiftPlannerMonth("2026-04", 1), "2026-05");
assert.match(formatPlannerMonthTitle("2026-04"), /2026/);
assert.equal(
  createPlannerCalendarDays({
    currentWorkDate: "2026-04-24",
    items: [
      {
        id: "guard",
        title: "Guard",
        description: "Guard planner model coverage",
        plannedDate: "2026-04-24",
        plannedTime: "09:00",
        status: "planned",
        priority: "normal",
        owner: "QA",
        target: "ДС",
        channel: "app",
        actionType: "ask-assistant",
        preparedText: "",
        requireApproval: false,
        recurrence: { type: "none" },
        updatedAt: "2026-04-24T09:00:00+05:00",
      },
    ],
    monthKey: "2026-04",
  }).find((day) => day.date === "2026-04-24")?.taskCount,
  1,
);
assert.match(aiStatusSource, /getAiAssistantTaskStatusForApprovalDecision/);
assert.match(aiStatusSource, /returned/);

assert.doesNotMatch(aiTabsSource, /\{ id: "chat"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "approvals"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "notifications"/);
assert.match(aiTabsSource, /\{ id: "main"/);
assert.match(aiTabsSource, /\{ id: "tasks"/);
assert.match(aiTabsSource, /\{ id: "documents"/);
assert.match(aiTabsSource, /\{ id: "settings"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "planner"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "agents"/);
assert.doesNotMatch(aiTabsSource, /\{ id: "development"/);

assert.match(aiAgentsPanelSource, /Активировано в текущем сеансе/);
assert.match(aiAgentsPanelSource, /Ключ активации/);
assert.match(aiAgentsPanelSource, /type="password"/);
assert.match(aiAgentsPanelSource, /autoComplete="off"/);
assert.doesNotMatch(aiAgentsPanelSource, /setActivatedAgentIds/);
assert.match(aiAgentsPanelSource, /onSetActivationDraft/);
assert.match(aiAgentsPanelSource, /requiresUserApproval/);
assert.match(aiDevelopmentPanelSource, /Сформировать ТЗ/);
assert.match(aiDevelopmentPanelSource, /Сформировать промт для Codex/);
assert.match(aiDevelopmentPanelSource, /onCreateCodexPromptDraft/);

assert.match(appPageShellSource, /<AiAssistantFloatingDockHost \/>/);
assert.match(appPageShellSource, /\.ai-floating-dock/);
assert.match(appRootSource, /<AiAssistantProvider currentWorkDate=\{appState\.reportDate\}>/);
assert.match(aiStateSource, /currentWorkDate = defaultAiAssistantDataset\.currentWorkDate/);
assert.match(aiStateSource, /currentDateTime: resolvedCurrentDateTime/);
assert.match(floatingDockHostSource, /dynamic\(/);
assert.match(floatingDockHostSource, /AiAssistantFloatingDock/);
assert.doesNotMatch(floatingDockSource, /AiAssistantFloatingNotifications/);
assert.match(floatingDockSource, /AiAssistantFloatingChat/);
assert.match(floatingDockSource, /activeNotifications/);
assert.match(floatingDockSource, /isActiveNotification/);
assert.match(floatingDockSource, /setApprovalDecision/);
assert.match(floatingDockSource, /onSetNotificationDecision/);
assert.doesNotMatch(floatingDockSource, /activePanel/);
assert.doesNotMatch(floatingDockSource, /setActivePanel/);
assert.doesNotMatch(floatingDockSource, /FloatingPanelTab/);
assert.doesNotMatch(floatingDockSource, /isNotificationsOpen/);
assert.doesNotMatch(floatingDockSource, /toggleWidget/);
assert.match(floatingDockSource, /position: "fixed"/);
assert.match(floatingDockSource, /right: 18/);
assert.match(floatingDockSource, /bottom: 18/);
assert.match(floatingDockSource, /floatingPanelStyle/);
assert.match(floatingChatSource, /AiAssistantFloatingNotifications/);
assert.match(floatingChatSource, /notifications: AiAssistantNotification\[\]/);
assert.match(floatingChatSource, /onSetNotificationDecision/);
assert.doesNotMatch(floatingChatSource, /position: "fixed"/);
assert.doesNotMatch(floatingChatSource, /onOpenChange/);
assert.match(floatingNotificationsSource, /className="ai-floating-notifications"/);
assert.match(floatingNotificationsSource, /notifications: AiAssistantNotification\[\]/);
assert.match(floatingNotificationsSource, /onNavigate/);
assert.match(floatingNotificationsSource, /onSetDecision/);
assert.match(floatingNotificationsSource, /approved/);
assert.match(floatingNotificationsSource, /rejected/);
assert.match(floatingNotificationsSource, /stopPropagation/);
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
