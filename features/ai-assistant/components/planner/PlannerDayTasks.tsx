"use client";

import { Check, CheckCircle2, Pencil, Plus, Trash2, X, XCircle } from "lucide-react";

import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import { requiresAiAssistantApproval } from "@/lib/domain/ai-assistant/approval-policy";
import type { PlannerDraft } from "@/features/ai-assistant/components/planner/plannerDraft";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import {
  formatPlannerActionType,
  formatPlannerDateLabel,
  formatPlannerPriority,
  formatPlannerRecurrence,
  formatPlannerStatus,
} from "@/features/ai-assistant/components/planner/plannerFormatters";
import {
  plannerActionsStyle,
  plannerCheckboxStyle,
  plannerDayHeaderStyle,
  plannerDayListStyle,
  plannerDayPanelStyle,
  plannerDayTaskActionsStyle,
  plannerDayTaskCardStyle,
  plannerDayTaskMetaStyle,
  plannerDayTaskTopStyle,
  plannerDraftCardStyle,
  plannerDraftFullRowStyle,
  plannerDraftGridStyle,
  plannerEmptyDayStyle,
  plannerInputStyle,
  plannerTextareaStyle,
} from "@/features/ai-assistant/components/planner/plannerStyles";
import { aiAssistantMutedTextStyle } from "@/features/ai-assistant/aiAssistantStyles";

type PlannerDecision = "approved" | "rejected";

export function PlannerDayTasks({
  draft,
  editingId,
  items,
  selectedDate,
  onCancelEdit,
  onChangeDraft,
  onDeleteItem,
  onSaveDraft,
  onSetPlannerDecision,
  onStartCreate,
  onStartEdit,
}: {
  draft: PlannerDraft;
  editingId: string | null;
  items: AiAssistantPlannerItem[];
  selectedDate: string;
  onCancelEdit: () => void;
  onChangeDraft: (draft: PlannerDraft) => void;
  onDeleteItem: (item: AiAssistantPlannerItem) => void;
  onSaveDraft: () => void;
  onSetPlannerDecision: (item: AiAssistantPlannerItem, decision: PlannerDecision) => void;
  onStartCreate: () => void;
  onStartEdit: (item: AiAssistantPlannerItem) => void;
}) {
  return (
    <div style={plannerDayPanelStyle}>
      <div style={plannerDayHeaderStyle}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>
            {formatPlannerDateLabel(selectedDate)}
          </div>
          <div style={aiAssistantMutedTextStyle}>
            {items.length > 0 ? `Задач: ${items.length}` : "На эту дату задач нет"}
          </div>
        </div>
        <PlannerIconButton label="Добавить задачу на дату" onClick={onStartCreate}>
          <Plus size={15} />
        </PlannerIconButton>
      </div>

      <div style={plannerDayListStyle}>
        {editingId === "new" && (
          <PlannerDraftCard
            draft={draft}
            onCancel={onCancelEdit}
            onChange={onChangeDraft}
            onSave={onSaveDraft}
          />
        )}

        {items.length === 0 && editingId !== "new" && (
          <div style={plannerEmptyDayStyle}>Выберите другую дату или добавьте задачу.</div>
        )}

        {items.map((item) => (
          editingId === item.id ? (
            <PlannerDraftCard
              key={item.id}
              draft={draft}
              onCancel={onCancelEdit}
              onChange={onChangeDraft}
              onSave={onSaveDraft}
            />
          ) : (
            <PlannerDayTaskCard
              key={item.id}
              item={item}
              onDeleteItem={onDeleteItem}
              onSetPlannerDecision={onSetPlannerDecision}
              onStartEdit={onStartEdit}
            />
          )
        ))}
      </div>
    </div>
  );
}

function PlannerDayTaskCard({
  item,
  onDeleteItem,
  onSetPlannerDecision,
  onStartEdit,
}: {
  item: AiAssistantPlannerItem;
  onDeleteItem: (item: AiAssistantPlannerItem) => void;
  onSetPlannerDecision: (item: AiAssistantPlannerItem, decision: PlannerDecision) => void;
  onStartEdit: (item: AiAssistantPlannerItem) => void;
}) {
  const needsApproval = item.requireApproval
    || requiresAiAssistantApproval(
      item.actionType,
      item.requireApproval ? "critical" : "low",
      item.channel,
    );
  const canDecide = !needsApproval && item.status !== "done" && item.status !== "cancelled";

  return (
    <div style={plannerDayTaskCardStyle}>
      <div style={plannerDayTaskTopStyle}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
          {item.description && <div style={aiAssistantMutedTextStyle}>{item.description}</div>}
          <div style={plannerDayTaskMetaStyle}>
            <span style={aiAssistantMutedTextStyle}>{item.plannedTime || "Без времени"}</span>
            <span style={aiAssistantMutedTextStyle}>{formatPlannerPriority(item.priority)}</span>
            <span style={aiAssistantMutedTextStyle}>{formatPlannerStatus(item.status)}</span>
            {item.recurrence && item.recurrence.type !== "none" && (
              <span style={aiAssistantMutedTextStyle}>{formatPlannerRecurrence(item.recurrence)}</span>
            )}
          </div>
        </div>
        <div style={plannerDayTaskActionsStyle}>
          {canDecide && (
            <>
              <PlannerIconButton
                label="Согласовать задачу"
                tone="primary"
                onClick={() => onSetPlannerDecision(item, "approved")}
              >
                <CheckCircle2 size={15} />
              </PlannerIconButton>
              <PlannerIconButton
                label="Отказать задачу"
                tone="danger"
                onClick={() => onSetPlannerDecision(item, "rejected")}
              >
                <XCircle size={15} />
              </PlannerIconButton>
            </>
          )}
          <PlannerIconButton label="Редактировать задачу" onClick={() => onStartEdit(item)}>
            <Pencil size={15} />
          </PlannerIconButton>
          <PlannerIconButton label="Удалить задачу" tone="danger" onClick={() => onDeleteItem(item)}>
            <Trash2 size={15} />
          </PlannerIconButton>
        </div>
      </div>

      <div style={{ marginTop: 8, color: "#0f172a", fontSize: 13, lineHeight: 1.45 }}>
        <strong>{formatPlannerActionType(item.actionType)}:</strong> {item.preparedText || "Текст не задан"}
      </div>
      <div style={plannerDayTaskMetaStyle}>
        <span style={aiAssistantMutedTextStyle}>{item.target}</span>
        <span style={aiAssistantMutedTextStyle}>{formatAiAssistantChannel(item.channel)}</span>
        {needsApproval && <span style={aiAssistantMutedTextStyle}>Требует решения</span>}
      </div>
    </div>
  );
}

function PlannerDraftCard({
  draft,
  onCancel,
  onChange,
  onSave,
}: {
  draft: PlannerDraft;
  onCancel: () => void;
  onChange: (draft: PlannerDraft) => void;
  onSave: () => void;
}) {
  return (
    <div style={plannerDraftCardStyle}>
      <div style={plannerDraftGridStyle}>
        <input
          aria-label="Дата"
          type="date"
          value={draft.plannedDate}
          onChange={(event) => onChange({ ...draft, plannedDate: event.target.value })}
          style={plannerInputStyle}
        />
        <input
          aria-label="Время"
          type="time"
          value={draft.plannedTime ?? ""}
          onChange={(event) => onChange({ ...draft, plannedTime: event.target.value })}
          style={plannerInputStyle}
        />
        <input
          aria-label="План"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          style={{ ...plannerInputStyle, ...plannerDraftFullRowStyle }}
        />
        <textarea
          aria-label="Описание"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          style={{ ...plannerTextareaStyle, ...plannerDraftFullRowStyle }}
        />
        <select
          aria-label="Действие"
          value={draft.actionType}
          onChange={(event) => onChange({ ...draft, actionType: event.target.value as AiAssistantPlannerItem["actionType"] })}
          style={plannerInputStyle}
        >
          <option value="ask-assistant">Поставить задачу</option>
          <option value="draft">Черновик</option>
          <option value="send-whatsapp">WhatsApp</option>
          <option value="send-mail">Письмо</option>
          <option value="create-calendar-event">Календарь</option>
          <option value="start-documentolog">Documentolog</option>
          <option value="prepare-document">Документ</option>
          <option value="create-push-notification">Push</option>
          <option value="update-knowledge-rule">Правило знаний</option>
          <option value="create-business-trip">Командировка</option>
          <option value="delete-data">Удаление данных</option>
        </select>
        <select
          aria-label="Повтор"
          value={draft.recurrence?.type ?? "none"}
          onChange={(event) => onChange({
            ...draft,
            recurrence: {
              ...(draft.recurrence ?? { type: "none" }),
              type: event.target.value as NonNullable<AiAssistantPlannerItem["recurrence"]>["type"],
            },
          })}
          style={plannerInputStyle}
        >
          <option value="none">Нет повтора</option>
          <option value="daily">Ежедневно</option>
          <option value="weekly">Еженедельно</option>
          <option value="monthly">Ежемесячно</option>
          <option value="every-n-days">Каждые N дней</option>
          <option value="custom">Настраиваемый</option>
        </select>
        {(draft.recurrence?.type === "every-n-days" || draft.recurrence?.type === "custom") && (
          <input
            aria-label="Интервал повтора"
            type="number"
            min={1}
            value={draft.recurrence.interval ?? 1}
            onChange={(event) => onChange({
              ...draft,
              recurrence: {
                ...(draft.recurrence ?? { type: "every-n-days" }),
                interval: Math.max(1, Number(event.target.value) || 1),
              },
            })}
            style={plannerInputStyle}
          />
        )}
        <textarea
          aria-label="Текст выполнения"
          value={draft.preparedText}
          onChange={(event) => onChange({ ...draft, preparedText: event.target.value })}
          style={{ ...plannerTextareaStyle, ...plannerDraftFullRowStyle }}
        />
        <input
          aria-label="Кому"
          value={draft.target}
          onChange={(event) => onChange({ ...draft, target: event.target.value })}
          style={plannerInputStyle}
        />
        <select
          aria-label="Канал"
          value={draft.channel}
          onChange={(event) => onChange({ ...draft, channel: event.target.value as AiAssistantPlannerItem["channel"] })}
          style={plannerInputStyle}
        >
          <option value="app">Система</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="documentolog">Documentolog</option>
          <option value="mail">Почта</option>
          <option value="calendar">Календарь</option>
          <option value="push">Push</option>
        </select>
        <select
          aria-label="Приоритет"
          value={draft.priority}
          onChange={(event) => onChange({ ...draft, priority: event.target.value as AiAssistantPlannerItem["priority"] })}
          style={plannerInputStyle}
        >
          <option value="low">Низкий</option>
          <option value="normal">Обычный</option>
          <option value="high">Высокий</option>
        </select>
        <select
          aria-label="Статус"
          value={draft.status}
          onChange={(event) => onChange({ ...draft, status: event.target.value as AiAssistantPlannerItem["status"] })}
          style={plannerInputStyle}
        >
          <option value="planned">Запланировано</option>
          <option value="needs-decision">Ожидает решения</option>
          <option value="in-progress">В работе</option>
          <option value="done">Выполнено</option>
          <option value="cancelled">Отменено</option>
        </select>
        <label style={{ ...plannerCheckboxStyle, ...plannerDraftFullRowStyle }}>
          <input
            type="checkbox"
            checked={draft.requireApproval}
            onChange={(event) => onChange({ ...draft, requireApproval: event.target.checked })}
          />
          <span>Согласовать перед выполнением</span>
        </label>
      </div>

      <div style={{ ...plannerActionsStyle, marginTop: 8 }}>
        <PlannerIconButton label="Сохранить задачу" tone="primary" onClick={onSave}>
          <Check size={15} />
        </PlannerIconButton>
        <PlannerIconButton label="Отмена" onClick={onCancel}>
          <X size={15} />
        </PlannerIconButton>
      </div>
    </div>
  );
}
