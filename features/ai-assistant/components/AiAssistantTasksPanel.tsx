"use client";

import { useMemo, useState } from "react";

import { TaskQueueSection } from "@/features/ai-assistant/components/tasks/TaskQueueSection";
import {
  createCurrentQueueRows,
  createQueueSections,
} from "@/features/ai-assistant/components/tasks/taskQueue";
import {
  tasksBlockTitleStyle,
  tasksHeaderStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";
import { formatTaskDateLabel } from "@/features/ai-assistant/components/tasks/taskFormatters";
import type {
  AiAssistantApprovalAction,
  AiAssistantNotification,
  AiAssistantPlannerItem,
  AiAssistantTask,
} from "@/features/ai-assistant/types";
import { aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

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
        <div style={tasksBlockTitleStyle}>Задачи на {formatTaskDateLabel(currentWorkDate)}</div>
      </div>

      {queueSections.map((section) => (
        <TaskQueueSection
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
