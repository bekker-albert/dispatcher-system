"use client";

import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

type PlannerDraft = Pick<
  AiAssistantPlannerItem,
  | "title"
  | "description"
  | "plannedDate"
  | "plannedTime"
  | "status"
  | "priority"
  | "target"
  | "channel"
  | "actionType"
  | "preparedText"
  | "requireApproval"
  | "recurrence"
>;

export function AiAssistantPlannerPanel({
  currentWorkDate,
  plannerItems,
  onChangePlannerItems,
}: {
  currentWorkDate: string;
  plannerItems: AiAssistantPlannerItem[];
  onChangePlannerItems: Dispatch<SetStateAction<AiAssistantPlannerItem[]>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlannerDraft>(() => createPlannerDraft(currentWorkDate));
  const sortedItems = useMemo(
    () => [...plannerItems].sort((a, b) => `${a.plannedDate} ${a.plannedTime ?? ""}`.localeCompare(`${b.plannedDate} ${b.plannedTime ?? ""}`)),
    [plannerItems],
  );

  const startCreate = () => {
    setEditingId("new");
    setDraft(createPlannerDraft(currentWorkDate));
  };

  const startEdit = (item: AiAssistantPlannerItem) => {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description,
      plannedDate: item.plannedDate,
      plannedTime: item.plannedTime,
      status: item.status,
      priority: item.priority,
      target: item.target,
      channel: item.channel,
      actionType: item.actionType,
      preparedText: item.preparedText,
      requireApproval: item.requireApproval,
      recurrence: item.recurrence ?? { type: "none" },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(createPlannerDraft(currentWorkDate));
  };

  const saveDraft = () => {
    const normalizedDraft = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      target: draft.target.trim(),
      plannedTime: draft.plannedTime?.trim() || undefined,
      recurrence: normalizeRecurrence(draft.recurrence ?? { type: "none" }),
    };

    if (!normalizedDraft.title || !normalizedDraft.target) return;

    if (editingId === "new") {
      onChangePlannerItems((current) => [
        ...current,
        {
          id: `plan-ai-${Date.now()}`,
          ...normalizedDraft,
          owner: "Текущий пользователь",
          updatedAt: new Date().toISOString(),
        },
      ]);
    } else if (editingId) {
      onChangePlannerItems((current) => current.map((item) => (
        item.id === editingId
          ? { ...item, ...normalizedDraft, updatedAt: new Date().toISOString() }
          : item
      )));
    }

    cancelEdit();
  };

  const deleteItem = (item: AiAssistantPlannerItem) => {
    const needsFutureApproval = item.requireApproval
      || Boolean(item.linkedTaskId || item.linkedNotificationId)
      || item.channel === "whatsapp"
      || item.channel === "mail"
      || item.channel === "documentolog";
    const message = needsFutureApproval
      ? `Удалить задачу "${item.title}"? В будущем такие связанные действия будут уходить на согласование.`
      : `Удалить задачу "${item.title}"?`;

    if (!window.confirm(message)) return;

    onChangePlannerItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    if (editingId === item.id) cancelEdit();
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={plannerHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>Планировщик</div>
          <div style={aiAssistantMutedTextStyle}>Рабочая дата: {formatDateLabel(currentWorkDate)}</div>
        </div>
        <IconButton label="Добавить задачу" onClick={startCreate}>
          <Plus size={15} />
        </IconButton>
      </div>
      <div style={aiAssistantTableWrapStyle}>
        <table style={plannerTableStyle}>
          <colgroup>
            <col style={plannerDateColumnStyle} />
            <col style={plannerPlanColumnStyle} />
            <col style={plannerExecutionColumnStyle} />
            <col style={plannerRecipientColumnStyle} />
            <col style={plannerPriorityColumnStyle} />
            <col style={plannerStatusColumnStyle} />
            <col style={plannerActionsColumnStyle} />
          </colgroup>
          <thead>
            <tr>
              <th style={compactThStyle}>Дата</th>
              <th style={aiAssistantThStyle}>План</th>
              <th style={aiAssistantThStyle}>Выполнение</th>
              <th style={compactThStyle}>Кому / канал</th>
              <th style={compactThStyle}>Приоритет</th>
              <th style={compactThStyle}>Статус</th>
              <th style={compactCenterThStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {editingId === "new" && (
              <PlannerEditRow
                draft={draft}
                onChange={setDraft}
                onSave={saveDraft}
                onCancel={cancelEdit}
              />
            )}
            {sortedItems.map((item) => (
              editingId === item.id ? (
                <PlannerEditRow
                  key={item.id}
                  draft={draft}
                  onChange={setDraft}
                  onSave={saveDraft}
                  onCancel={cancelEdit}
                />
              ) : (
                <tr key={item.id}>
                  <td style={compactTdStyle}>
                    <div style={{ fontWeight: 900 }}>{formatDateLabel(item.plannedDate)}</div>
                    {item.plannedTime && <div style={aiAssistantMutedTextStyle}>{item.plannedTime}</div>}
                    {item.recurrence && item.recurrence.type !== "none" && (
                      <div style={aiAssistantMutedTextStyle}>{formatRecurrence(item.recurrence)}</div>
                    )}
                  </td>
                  <td style={aiAssistantTextTdStyle}>
                    <div style={{ fontWeight: 900 }}>{item.title}</div>
                    <div style={aiAssistantMutedTextStyle}>{item.description}</div>
                    {item.comment && <div style={aiAssistantMutedTextStyle}>{item.comment}</div>}
                  </td>
                  <td style={aiAssistantTextTdStyle}>
                    <div style={{ fontWeight: 900 }}>{formatActionType(item.actionType)}</div>
                    <div style={aiAssistantMutedTextStyle}>{item.preparedText}</div>
                    {item.requireApproval && <div style={aiAssistantMutedTextStyle}>Требует решения перед выполнением</div>}
                  </td>
                  <td style={plannerRecipientViewTdStyle}>
                    <div style={{ fontWeight: 900 }}>{item.target}</div>
                    <div style={aiAssistantMutedTextStyle}>{formatAiAssistantChannel(item.channel)}</div>
                  </td>
                  <td style={compactTdStyle}>{formatPriority(item.priority)}</td>
                  <td style={compactTdStyle}>{formatPlannerStatus(item.status)}</td>
                  <td style={compactCenterTdStyle}>
                    <span style={plannerActionsStyle}>
                      <IconButton label="Редактировать задачу" onClick={() => startEdit(item)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="Удалить задачу" tone="danger" onClick={() => deleteItem(item)}>
                        <Trash2 size={15} />
                      </IconButton>
                    </span>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlannerEditRow({
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
          <IconButton label="Сохранить задачу" tone="primary" onClick={onSave}>
            <Check size={15} />
          </IconButton>
          <IconButton label="Отмена" onClick={onCancel}>
            <X size={15} />
          </IconButton>
        </span>
      </td>
    </tr>
  );
}

function IconButton({
  label,
  tone = "secondary",
  onClick,
  children,
}: {
  label: string;
  tone?: "primary" | "danger" | "secondary";
  onClick: () => void;
  children: ReactNode;
}) {
  const style = tone === "primary"
    ? primaryIconButtonStyle
    : tone === "danger"
      ? dangerIconButtonStyle
      : secondaryIconButtonStyle;

  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function createPlannerDraft(currentWorkDate: string): PlannerDraft {
  return {
    title: "",
    description: "",
    plannedDate: currentWorkDate,
    plannedTime: "",
    status: "planned",
    priority: "normal",
    target: "",
    channel: "app",
    actionType: "ask-assistant",
    preparedText: "",
    requireApproval: true,
    recurrence: { type: "none" },
  };
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function formatPriority(priority: AiAssistantPlannerItem["priority"]) {
  const labels: Record<AiAssistantPlannerItem["priority"], string> = {
    low: "Низкий",
    normal: "Обычный",
    high: "Высокий",
  };

  return labels[priority];
}

function formatPlannerStatus(status: AiAssistantPlannerItem["status"]) {
  const labels: Record<AiAssistantPlannerItem["status"], string> = {
    planned: "Запланировано",
    "needs-decision": "Ожидает решения",
    "in-progress": "В работе",
    done: "Выполнено",
    cancelled: "Отменено",
  };

  return labels[status];
}

function formatActionType(actionType: AiAssistantPlannerItem["actionType"]) {
  const labels: Record<AiAssistantPlannerItem["actionType"], string> = {
    "ask-assistant": "Поставить задачу",
    draft: "Черновик",
    "prepare-document": "Документ",
    "send-whatsapp": "WhatsApp",
    "send-mail": "Письмо",
    "create-calendar-event": "Календарь",
    "start-documentolog": "Documentolog",
    "create-push-notification": "Push",
    "update-report-reason": "Поставить задачу",
    "update-knowledge-rule": "Правило знаний",
    "create-business-trip": "Командировка",
    "delete-data": "Удаление",
  };

  return labels[actionType];
}

function normalizeRecurrence(recurrence: NonNullable<AiAssistantPlannerItem["recurrence"]>) {
  if (recurrence.type === "none") return { type: "none" as const };
  if (recurrence.type === "every-n-days" || recurrence.type === "custom") {
    return {
      ...recurrence,
      interval: Math.max(1, recurrence.interval ?? 1),
    };
  }

  return recurrence;
}

function formatRecurrence(recurrence: NonNullable<AiAssistantPlannerItem["recurrence"]>) {
  const labels: Record<NonNullable<AiAssistantPlannerItem["recurrence"]>["type"], string> = {
    none: "Без повтора",
    daily: "Ежедневно",
    weekly: "Еженедельно",
    monthly: "Ежемесячно",
    "every-n-days": `Каждые ${recurrence.interval ?? 1} дн.`,
    custom: `Повтор: ${recurrence.interval ?? 1}`,
  };

  return labels[recurrence.type];
}

const plannerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const plannerActionsStyle: CSSProperties = {
  display: "inline-flex",
  gap: 5,
  alignItems: "center",
  justifyContent: "center",
};

const plannerTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1440,
};

const plannerDateColumnStyle: CSSProperties = { width: 150 };
const plannerPlanColumnStyle: CSSProperties = { width: "28%" };
const plannerExecutionColumnStyle: CSSProperties = { width: "32%" };
const plannerRecipientColumnStyle: CSSProperties = { width: 210 };
const plannerPriorityColumnStyle: CSSProperties = { width: 118 };
const plannerStatusColumnStyle: CSSProperties = { width: 158 };
const plannerActionsColumnStyle: CSSProperties = { width: 84 };

const aiAssistantTextTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

const plannerRecipientViewTdStyle: CSSProperties = {
  ...aiAssistantTextTdStyle,
  whiteSpace: "normal",
};

const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  whiteSpace: "nowrap",
};

const compactCenterThStyle: CSSProperties = {
  ...compactThStyle,
  textAlign: "center",
};

const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  whiteSpace: "nowrap",
};

const compactCenterTdStyle: CSSProperties = {
  ...compactTdStyle,
  textAlign: "center",
};

const plannerEditTdBaseStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  verticalAlign: "top",
};

const plannerDateEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 150,
};

const plannerMainEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 280,
  overflowWrap: "anywhere",
};

const plannerRecipientEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 210,
};

const plannerSelectEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 118,
};

const plannerStatusEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  minWidth: 158,
};

const plannerActionsEditTdStyle: CSSProperties = {
  ...plannerEditTdBaseStyle,
  width: 76,
  minWidth: 76,
  textAlign: "center",
};

const plannerInputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 8px",
  font: "inherit",
  fontSize: 13,
  marginBottom: 5,
};

const plannerTextareaStyle: CSSProperties = {
  ...plannerInputStyle,
  minHeight: 54,
  resize: "vertical",
};

const plannerCheckboxStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
  color: "#334155",
};

const baseIconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  cursor: "pointer",
};

const primaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const dangerIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #b91c1c",
  background: "#ffffff",
  color: "#b91c1c",
};

const secondaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};
