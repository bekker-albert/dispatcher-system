"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, FileText, MessageSquare, Pencil, RotateCcw, Send } from "lucide-react";

import { AiAssistantStatusPill } from "@/features/ai-assistant/components/AiAssistantStatusPill";
import type {
  AiAssistantApprovalAction,
  AiAssistantPlannerItem,
  AiAssistantTab,
  AiAssistantTask,
  AiAssistantViewModel,
} from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";
import type { SettingsSection } from "@/features/ai-assistant/components/AiAssistantSettingsPanel";
import { createDraftCards, type DraftCardItem } from "@/features/ai-assistant/components/home/homeDraftCards";
import {
  contextLineStyle,
  dashboardGridStyle,
  draftTitleRowStyle,
  emptyLineStyle,
  homeBlockListStyle,
  homeBlockStyle,
  homeBlockTitleStyle,
  homeHeroStyle,
  homeTitleStyle,
  latestActionStyle,
  latestActionTitleStyle,
  miniActionsStyle,
  miniCardStyle,
  miniCardTitleStyle,
  openButtonStyle,
  primaryMiniButtonStyle,
  quickCommandsStyle,
  quickCommandStyle,
  requestButtonStyle,
  requestFeedbackStyle,
  requestInputStyle,
  requestRowStyle,
  secondaryMiniButtonStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryTitleStyle,
  summaryValueStyle,
  timeStyle,
  todayRowStyle,
} from "@/features/ai-assistant/components/home/homeStyles";

type QuickCommand = {
  label: string;
  prompt: string;
};

const quickCommands: QuickCommand[] = [
  { label: "Подготовить служебку", prompt: "Подготовь служебную записку" },
  { label: "Проверить причину невыполнения", prompt: "Проверь причину невыполнения плана" },
  { label: "Составить сообщение подрядчику", prompt: "Составь сообщение подрядчику" },
  { label: "Найти проблему по технике", prompt: "Найди проблему по технике" },
  { label: "Создать задачу", prompt: "Создай задачу" },
];

export function AiAssistantHomePanel({
  viewModel,
  onAppendChatMessage,
  onOpenSettingsSection,
  onSetActiveTab,
  onSetApprovalDecision,
}: {
  viewModel: AiAssistantViewModel;
  onAppendChatMessage: (text: string) => void;
  onOpenSettingsSection: (section: SettingsSection) => void;
  onSetActiveTab: (tab: AiAssistantTab) => void;
  onSetApprovalDecision: (
    approval: AiAssistantApprovalAction,
    status: "approved" | "returned" | "rejected",
    task?: AiAssistantTask,
  ) => void;
}) {
  const [requestText, setRequestText] = useState("");
  const [lastSubmittedRequest, setLastSubmittedRequest] = useState("");
  const tasksByApprovalId = useMemo(
    () => new Map(viewModel.tasks.map((task) => [task.approvalActionId, task])),
    [viewModel.tasks],
  );
  const todayItems = viewModel.plannerItems.filter((item) => item.plannedDate === viewModel.currentWorkDate);
  const draftItems = createDraftCards(viewModel.documents, viewModel.mailDrafts, viewModel.documentologItems);
  const latestAuditActions = viewModel.auditEvents;
  const approvalCards = viewModel.approvalActions
    .filter((approval) => approval.status === "required")
    .slice(0, 3);
  const todayCards = todayItems;
  const visibleTodayCards = todayItems.slice(0, 5);
  const draftCards = draftItems;
  const visibleDraftCards = draftItems.slice(0, 3);
  const latestActions = latestAuditActions;
  const visibleLatestActions = latestAuditActions.slice(0, 4);

  const submitRequest = (text = requestText) => {
    const normalizedText = text.trim();
    if (!normalizedText) return;
    onAppendChatMessage(normalizedText);
    setLastSubmittedRequest(normalizedText);
    setRequestText("");
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={homeHeroStyle}>
        <div style={homeTitleStyle}>Что нужно сделать?</div>
        <div style={requestRowStyle}>
          <input
            aria-label="Запрос AI-ассистенту"
            value={requestText}
            onChange={(event) => setRequestText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitRequest();
            }}
            placeholder="Например: подготовь сообщение подрядчику по GPS"
            style={requestInputStyle}
          />
          <button type="button" onClick={() => submitRequest()} style={requestButtonStyle}>
            <Send size={16} />
            <span>Отправить</span>
          </button>
        </div>
        <div style={quickCommandsStyle}>
          {quickCommands.map((command) => (
            <button
              key={command.label}
              type="button"
              onClick={() => submitRequest(command.prompt)}
              style={quickCommandStyle}
            >
              {command.label}
            </button>
          ))}
        </div>
        {lastSubmittedRequest ? (
          <div style={requestFeedbackStyle}>Запрос принят: {lastSubmittedRequest}</div>
        ) : null}
      </div>

      <div style={summaryGridStyle}>
        <SummaryCard title="Требуют решения" value={viewModel.summary.approvalsRequired} onClick={() => onSetActiveTab("tasks")} />
        <SummaryCard title="Черновики" value={draftCards.length} onClick={() => onSetActiveTab("documents")} />
        <SummaryCard title="Сегодня" value={todayCards.length} onClick={() => onSetActiveTab("tasks")} />
        <SummaryCard title="Последние действия" value={latestActions.length} onClick={() => onOpenSettingsSection("audit")} />
      </div>

      <div style={dashboardGridStyle}>
        <HomeBlock title="Требуют решения">
          {approvalCards.length > 0 ? approvalCards.map((approval) => {
            const task = tasksByApprovalId.get(approval.id);

            return (
              <DecisionCard
                key={approval.id}
                approval={approval}
                task={task}
                onApprove={() => onSetApprovalDecision(approval, "approved", task)}
                onEdit={() => onSetActiveTab("tasks")}
                onReturn={() => onSetApprovalDecision(approval, "returned", task)}
              />
            );
          }) : <EmptyLine text="Нет решений на согласовании." />}
        </HomeBlock>

        <HomeBlock title="Черновики">
          {draftCards.length > 0 ? visibleDraftCards.map((draft) => (
            <DraftCard key={draft.id} draft={draft} onOpen={() => onSetActiveTab("documents")} />
          )) : <EmptyLine text="Черновиков нет." />}
        </HomeBlock>

        <HomeBlock title="Сегодня">
          {todayCards.length > 0 ? visibleTodayCards.map((item) => (
            <TodayCard key={item.id} item={item} onOpen={() => onSetActiveTab("tasks")} />
          )) : <EmptyLine text="На сегодня задач нет." />}
        </HomeBlock>

        <HomeBlock title="Последние действия">
          {latestActions.length > 0 ? visibleLatestActions.map((event) => (
            <div key={event.id} style={latestActionStyle}>
              <span style={latestActionTitleStyle}>{event.action}</span>
              <span style={aiAssistantMutedTextStyle}>{event.actor}</span>
            </div>
          )) : <EmptyLine text="Журнал пуст." />}
        </HomeBlock>
      </div>
    </section>
  );
}

function SummaryCard({ title, value, onClick }: { title: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={summaryCardStyle}>
      <span style={summaryValueStyle}>{value}</span>
      <span style={summaryTitleStyle}>{title}</span>
    </button>
  );
}

function HomeBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div style={homeBlockStyle}>
      <div style={homeBlockTitleStyle}>{title}</div>
      <div style={homeBlockListStyle}>{children}</div>
    </div>
  );
}

function DecisionCard({
  approval,
  task,
  onApprove,
  onEdit,
  onReturn,
}: {
  approval: AiAssistantApprovalAction;
  task?: AiAssistantTask;
  onApprove: () => void;
  onEdit: () => void;
  onReturn: () => void;
}) {
  return (
    <div style={miniCardStyle}>
      <div style={miniCardTitleStyle}>{approval.title}</div>
      <div style={aiAssistantMutedTextStyle}>{approval.draftText || task?.resultDraft || task?.prompt}</div>
      <div style={contextLineStyle}>{approval.targetLabel}</div>
      <div style={miniActionsStyle}>
        <button type="button" onClick={onApprove} style={primaryMiniButtonStyle}>
          <Check size={14} /> Согласовать
        </button>
        <button type="button" onClick={onEdit} style={secondaryMiniButtonStyle}>
          <Pencil size={14} /> Редактировать
        </button>
        <button type="button" onClick={onReturn} style={secondaryMiniButtonStyle}>
          <RotateCcw size={14} /> Вернуть
        </button>
      </div>
    </div>
  );
}

function TodayCard({ item, onOpen }: { item: AiAssistantPlannerItem; onOpen: () => void }) {
  return (
    <div style={miniCardStyle}>
      <div style={todayRowStyle}>
        <span style={timeStyle}>{item.plannedTime || "сегодня"}</span>
        <AiAssistantStatusPill status={item.status === "done" ? "approved" : item.status === "cancelled" ? "cancelled" : "queued"} />
      </div>
      <div style={miniCardTitleStyle}>{item.title}</div>
      <button type="button" onClick={onOpen} style={openButtonStyle}>Открыть</button>
    </div>
  );
}

function DraftCard({ draft, onOpen }: { draft: DraftCardItem; onOpen: () => void }) {
  const Icon = draft.kind === "message" ? MessageSquare : draft.kind === "mail" ? Send : FileText;

  return (
    <div style={miniCardStyle}>
      <div style={draftTitleRowStyle}>
        <Icon size={15} />
        <span style={miniCardTitleStyle}>{draft.title}</span>
      </div>
      <div style={aiAssistantMutedTextStyle}>{formatDraftStatus(draft.status)}</div>
      <button type="button" onClick={onOpen} style={openButtonStyle}>Открыть</button>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div style={emptyLineStyle}>{text}</div>;
}

function formatDraftStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Черновик",
    review: "На проверке",
    approved: "Согласовано",
    "needs-approval": "Ожидает решения",
    sent: "Отправлено",
    rejected: "Отклонено",
    "in-approval": "На согласовании",
    "needs-rework": "Нужна доработка",
    prepared: "Подготовлено",
  };

  return labels[status] ?? status;
}
