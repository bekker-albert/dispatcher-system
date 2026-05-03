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
  onUpdateApprovalDraftText,
  onSetApprovalDecision,
}: {
  approvals: AiAssistantApprovalAction[];
  currentWorkDate: string;
  tasks: AiAssistantTask[];
  notifications: AiAssistantNotification[];
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
    () => createCurrentQueueRows(tasks, notifications, approvals),
    [approvals, notifications, tasks],
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
      <div style={tasksBlockStyle}>
        <div style={tasksBlockTitleStyle}>Задачи на {formatDateLabel(currentWorkDate)}</div>
        <div style={aiAssistantTableWrapStyle}>
          <table style={tasksTableStyle}>
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
              {currentRows.map((row) => (
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
                        onChangeText={setEditingText}
                      />
                    ) : row.text}
                  </td>
                  <td style={compactCenterTdStyle}>
                    {row.approval && (
                      <ApprovalActionsCell
                        approval={row.approval}
                        editingId={editingId}
                        onStartEdit={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        onDecision={setDecision}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
        </IconActionButton>
        <IconActionButton label="Отмена" onClick={onCancel}>
          <X size={15} />
        </IconActionButton>
      </div>
    );
  }

  if (approval.status !== "required") {
    return (
      <IconActionButton label="Редактировать" onClick={() => onStartEdit(approval)}>
        <Pencil size={15} />
      </IconActionButton>
    );
  }

  return (
    <div style={iconActionsStyle}>
      <IconActionButton label="Согласовать" tone="primary" onClick={() => onDecision(approval.id, "approved")}>
        <Check size={15} />
      </IconActionButton>
      <IconActionButton label="Отказать" tone="danger" onClick={() => onDecision(approval.id, "rejected")}>
        <X size={15} />
      </IconActionButton>
      <IconActionButton label="Редактировать" onClick={() => onStartEdit(approval)}>
        <Pencil size={15} />
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
): CurrentQueueRow[] {
  const approvalsByTaskId = new Map(approvals.map((approval) => [approval.taskId, approval]));
  const notificationsByTaskId = new Map(
    notifications
      .filter((notification) => notification.linkedTaskId)
      .map((notification) => [notification.linkedTaskId!, notification]),
  );
  const taskRows = tasks.map((task) => {
    const linkedNotification = notificationsByTaskId.get(task.id);
    const approval = task.approvalActionId ? approvalsByTaskId.get(task.id) : undefined;

    return {
      id: task.id,
      title: task.title,
      details: linkedNotification?.title ?? task.prompt,
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

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

const tasksBlockStyle: CSSProperties = {
  display: "grid",
  gap: 8,
};

const tasksBlockTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

const tasksTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "auto",
};

const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  width: "1%",
  whiteSpace: "nowrap",
};

const compactCenterThStyle: CSSProperties = {
  ...compactThStyle,
  textAlign: "center",
};

const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  width: "1%",
  whiteSpace: "nowrap",
};

const compactCenterTdStyle: CSSProperties = {
  ...compactTdStyle,
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
  gap: 5,
  whiteSpace: "nowrap",
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
