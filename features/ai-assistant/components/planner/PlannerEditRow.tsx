"use client";

import { Check, X } from "lucide-react";

import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import type { PlannerDraft } from "@/features/ai-assistant/components/planner/plannerDraft";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import {
  plannerActionsEditTdStyle,
  plannerActionsStyle,
  plannerCheckboxStyle,
  plannerDateEditTdStyle,
  plannerInputStyle,
  plannerMainEditTdStyle,
  plannerRecipientEditTdStyle,
  plannerSelectEditTdStyle,
  plannerStatusEditTdStyle,
  plannerTextareaStyle,
} from "@/features/ai-assistant/components/planner/plannerStyles";

export function PlannerEditRow({
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  draft: PlannerDraft;
  onChange: (draft: PlannerDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <tr>
      <td style={plannerDateEditTdStyle}>
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
      </td>
      <td style={plannerMainEditTdStyle}>
        <input
          aria-label="План"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          style={plannerInputStyle}
        />
        <textarea
          aria-label="Описание"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          style={plannerTextareaStyle}
        />
      </td>
      <td style={plannerMainEditTdStyle}>
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
        <textarea
          aria-label="Текст выполнения"
          value={draft.preparedText}
          onChange={(event) => onChange({ ...draft, preparedText: event.target.value })}
          style={plannerTextareaStyle}
        />
        <label style={plannerCheckboxStyle}>
          <input
            type="checkbox"
            checked={draft.requireApproval}
            onChange={(event) => onChange({ ...draft, requireApproval: event.target.checked })}
          />
          <span>Согласовать перед выполнением</span>
        </label>
      </td>
      <td style={plannerRecipientEditTdStyle}>
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
      </td>
      <td style={plannerSelectEditTdStyle}>
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
      </td>
      <td style={plannerStatusEditTdStyle}>
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
      </td>
      <td style={plannerActionsEditTdStyle}>
        <span style={plannerActionsStyle}>
          <PlannerIconButton label="Сохранить задачу" tone="primary" onClick={onSave}>
            <Check size={15} />
          </PlannerIconButton>
          <PlannerIconButton label="Отмена" onClick={onCancel}>
            <X size={15} />
          </PlannerIconButton>
        </span>
      </td>
    </tr>
  );
}
