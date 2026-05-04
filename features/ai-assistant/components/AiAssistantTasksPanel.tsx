"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

import { AiAssistantStatusPill } from "@/features/ai-assistant/components/AiAssistantStatusPill";
import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type {
  AiAssistantApprovalAction,
  AiAssistantNotification,
  AiAssistantNotificationChannel,
  AiAssistantPlannerItem,
  AiAssistantTask,
  AiAssistantTaskStatus,
} from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

type CurrentQueueRow = {
  id: string;
  title: string;
  details?: string;
  channel: AiAssistantNotificationChannel;
  status: AiAssistantTaskStatus;
  text: string;
  approval?: AiAssistantApprovalAction;
  task?: AiAssistantTask;
};

export function AiAssistantTasksPanel({
  approvals,
  currentWorkDate,
  tasks,
  notifications,
  plannerItems,
  onUpdateApprovalDraftText,
  onSetApprovalDecision,
}: {
  approvals: AiAssistantApprovalAction[];
  currentWorkDate: string;
  tasks: AiAssistantTask[];
  notifications: AiAssistantNotification[];
  plannerItems: AiAssistantPlannerItem[];
  onUpdateApprovalDraftText: (approval: AiAssistantApprovalAction, draftText: string) => void;
  onSetApprovalDecision: (
    approval: AiAssistantApprovalAction,
    status: "approved" | "rejected",
    task?: AiAssistantTask,
  ) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const currentRows = useMemo(
    () => createCurrentQueueRows(tasks, notifications, approvals, plannerItems),
    [approvals, notifications, plannerItems, tasks],
  );
  const queueSections = useMemo(
    () => createQueueSections(currentRows),
    [currentRows],
  );

  const startEdit = (approval: AiAssistantApprovalAction) => {
    setEditingId(approval.id);
    setEditingText(approval.draftText);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = (approvalId: string) => {
    const approval = approvals.find((item) => item.id === approvalId);
    if (approval) onUpdateApprovalDraftText(approval, editingText);
    cancelEdit();
  };

  const setDecision = (approvalId: string, status: "approved" | "rejected") => {
    const row = currentRows.find((item) => item.approval?.id === approvalId);
    if (!row?.approval) return;
    onSetApprovalDecision(row.approval, status, row.task);
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={tasksHeaderStyle}>
        <div style={tasksBlockTitleStyle}>Задачи на {formatDateLabel(currentWorkDate)}</div>
      </div>

      {queueSections.map((section) => (
        <QueueSection
          key={section.title}
          title={section.title}
          rows={section.rows}
          editingId={editingId}
          editingText={editingText}
          onChangeEditingText={setEditingText}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onDecision={setDecision}
        />
      ))}
    </section>
  );
}

function QueueSection({
  title,
  rows,
  editingId,
  editingText,
  onChangeEditingText,
  onStartEdit,
  onSave,
  onCancel,
  onDecision,
}: {
  title: string;
  rows: CurrentQueueRow[];
  editingId: string | null;
  editingText: string;
  onChangeEditingText: (value: string) => void;
  onStartEdit: (approval: AiAssistantApprovalAction) => void;
  onSave: (approvalId: string) => void;
  onCancel: () => void;
  onDecision: (approvalId: string, status: "approved" | "rejected") => void;
}) {
  return (
    <div style={tasksBlockStyle}>
      <div style={queueSectionTitleStyle}>{title}</div>
      <div style={aiAssistantTableWrapStyle}>
        <table style={tasksTableStyle}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: 98 }} />
            <col style={{ width: 132 }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: 210 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Задача</th>
              <th style={compactThStyle}>Канал</th>
              <th style={compactThStyle}>Статус</th>
              <th style={aiAssistantThStyle}>Текст</th>
              <th style={compactCenterThStyle}>Решение</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={emptyTdStyle} colSpan={5}>Нет записей</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={aiAssistantTextTdStyle}>
                  <div style={{ fontWeight: 900 }}>{row.title}</div>
                  {row.details && <div style={aiAssistantMutedTextStyle}>{row.details}</div>}
                </td>
                <td style={compactTdStyle}>{formatAiAssistantChannel(row.channel)}</td>
                <td style={compactTdStyle}><AiAssistantStatusPill status={row.status} /></td>
                <td style={aiAssistantMultilineTdStyle}>
                  {row.approval ? (
                    <ApprovalTextCell
                      approval={row.approval}
                      editingId={editingId}
                      editingText={editingText}
                      fallbackText={row.text}
                      onChangeText={onChangeEditingText}
                    />
                  ) : row.text}
                </td>
                <td style={compactCenterTdStyle}>
                  {row.approval && (
                    <ApprovalActionsCell
                      approval={row.approval}
                      editingId={editingId}
                      onStartEdit={onStartEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      onDecision={onDecision}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApprovalTextCell({
  approval,
  editingId,
  editingText,
  fallbackText,
  onChangeText,
}: {
  approval: AiAssistantApprovalAction;
  editingId: string | null;
  editingText: string;
  fallbackText: string;
  onChangeText: (value: string) => void;
}) {
  if (editingId === approval.id) {
    return (
      <textarea
        value={editingText}
        onChange={(event) => onChangeText(event.target.value)}
        style={approvalTextareaStyle}
      />
    );
  }

  return <div>{approval.draftText || fallbackText}</div>;
}

function ApprovalActionsCell({
  approval,
  editingId,
  onStartEdit,
  onSave,
  onCancel,
  onDecision,
}: {
  approval: AiAssistantApprovalAction;
  editingId: string | null;
  onStartEdit: (approval: AiAssistantApprovalAction) => void;
  onSave: (approvalId: string) => void;
  onCancel: () => void;
  onDecision: (approvalId: string, status: "approved" | "rejected") => void;
}) {
  if (editingId === approval.id) {
    return (
      <div style={iconActionsStyle}>
        <IconActionButton label="Сохранить" tone="primary" onClick={() => onSave(approval.id)}>
          <Check size={15} />
          <span>Сохранить</span>
        </IconActionButton>
        <IconActionButton label="Отмена" onClick={onCancel}>
          <X size={15} />
          <span>Отмена</span>
        </IconActionButton>
      </div>
    );
  }

  if (approval.status !== "required") {
    return (
      <IconActionButton label="Редактировать" onClick={() => onStartEdit(approval)}>
        <Pencil size={15} />
        <span>Редактировать</span>
      </IconActionButton>
    );
  }

  return (
    <div style={iconActionsStyle}>
      <IconActionButton label="Согласовать" tone="primary" onClick={() => onDecision(approval.id, "approved")}>
        <Check size={15} />
        <span>Согласовать</span>
      </IconActionButton>
      <IconActionButton label="Отказать" tone="danger" onClick={() => onDecision(approval.id, "rejected")}>
        <X size={15} />
        <span>Отказать</span>
      </IconActionButton>
      <IconActionButton label="Редактировать" onClick={() => onStartEdit(approval)}>
        <Pencil size={15} />
        <span>Редактировать</span>
      </IconActionButton>
      <IconActionButton label="Вернуть на доработку" onClick={() => onDecision(approval.id, "rejected")}>
        <X size={15} />
        <span>Доработать</span>
      </IconActionButton>
    </div>
  );
}

function IconActionButton({
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

function createCurrentQueueRows(
  tasks: AiAssistantTask[],
  notifications: AiAssistantNotification[],
  approvals: AiAssistantApprovalAction[],
  plannerItems: AiAssistantPlannerItem[],
): CurrentQueueRow[] {
  const approvalsByTaskId = new Map(approvals.map((approval) => [approval.taskId, approval]));
  const approvalsById = new Map(approvals.map((approval) => [approval.id, approval]));
  const plannerByTaskId = new Map(
    plannerItems
      .filter((item) => item.linkedTaskId)
      .map((item) => [item.linkedTaskId!, item]),
  );
  const notificationsByTaskId = new Map(
    notifications
      .filter((notification) => notification.linkedTaskId)
      .map((notification) => [notification.linkedTaskId!, notification]),
  );
  const taskRows = tasks.map((task) => {
    const linkedNotification = notificationsByTaskId.get(task.id);
    const approval = task.approvalActionId
      ? approvalsById.get(task.approvalActionId) ?? approvalsByTaskId.get(task.id)
      : undefined;
    const plannerItem = plannerByTaskId.get(task.id);

    return {
      id: task.id,
      title: task.title,
      details: formatTaskDetails(task, plannerItem, linkedNotification),
      channel: linkedNotification?.channel ?? task.channel,
      status: task.status,
      text: approval?.draftText ?? task.resultDraft ?? linkedNotification?.body ?? "",
      approval,
      task,
    };
  });
  const taskIds = new Set(tasks.map((task) => task.id));
  const notificationRows = notifications
    .filter((notification) => !notification.linkedTaskId || !taskIds.has(notification.linkedTaskId))
    .map((notification) => ({
      id: notification.id,
      title: notification.title,
      details: notification.target,
      channel: notification.channel,
      status: notification.status,
      text: notification.body,
    }));

  return [...taskRows, ...notificationRows];
}

function createQueueSections(rows: CurrentQueueRow[]) {
  const decisionRows = rows.filter(isDecisionRow);
  const decisionIds = new Set(decisionRows.map((row) => row.id));
  const draftRows = rows.filter((row) => !decisionIds.has(row.id) && isDraftRow(row));
  const draftIds = new Set(draftRows.map((row) => row.id));
  const currentTaskRows = rows.filter((row) => !decisionIds.has(row.id) && !draftIds.has(row.id));

  return [
    { title: "Требуют моего решения", rows: decisionRows },
    { title: "Текущие задачи", rows: currentTaskRows },
    { title: "Черновики и подготовленные действия", rows: draftRows },
  ];
}

function isDecisionRow(row: CurrentQueueRow) {
  return row.approval?.status === "required"
    || row.task?.approvalStatus === "required"
    || row.status === "needs-approval";
}

function isDraftRow(row: CurrentQueueRow) {
  return row.status === "draft" || Boolean(row.approval && row.approval.status !== "required");
}

function formatTaskDetails(
  task: AiAssistantTask,
  plannerItem?: AiAssistantPlannerItem,
  linkedNotification?: AiAssistantNotification,
) {
  if (!plannerItem) return linkedNotification?.title ?? task.prompt;

  const plannedAt = [
    formatDateLabel(plannerItem.plannedDate),
    plannerItem.plannedTime,
  ].filter(Boolean).join(" ");

  return `Планировщик: ${plannedAt}. ${plannerItem.description || task.prompt}`;
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

const tasksBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 10,
};

const tasksHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const tasksBlockTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

const queueSectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

const tasksTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1080,
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

const emptyTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  color: "#64748b",
  textAlign: "center",
};

const aiAssistantTextTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

const aiAssistantMultilineTdStyle: CSSProperties = {
  ...aiAssistantTextTdStyle,
  whiteSpace: "pre-wrap",
};

const approvalTextareaStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  minHeight: 90,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  padding: 8,
  font: "inherit",
};

const iconActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: 5,
};

const baseIconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  minHeight: 28,
  padding: "0 7px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 800,
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
