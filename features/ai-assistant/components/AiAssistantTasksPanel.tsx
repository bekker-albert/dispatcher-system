"use client";

import { useMemo, useState } from "react";

import { TaskQueueSection } from "@/features/ai-assistant/components/tasks/TaskQueueSection";
import {
  createCurrentQueueRows,
  createStatusQueueSections,
  createTaskStatusSummary,
  filterQueueRows,
  taskStatusFilterOptions,
  type TaskStatusFilter,
} from "@/features/ai-assistant/components/tasks/taskQueue";
import {
  emptyTaskStateStyle,
  statusSummaryItemStyle,
  statusSummaryStyle,
  tasksBlockTitleStyle,
  tasksHeaderStyle,
  tasksSearchInputStyle,
  tasksStatusSelectStyle,
  tasksToolbarStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";
import { formatTaskDateLabel } from "@/features/ai-assistant/components/tasks/taskFormatters";
import type {
  AiAssistantApprovalAction,
  AiAssistantNotification,
  AiAssistantPlannerItem,
  AiAssistantTask,
} from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle, aiAssistantPanelStyle } from "@/features/ai-assistant/aiAssistantStyles";

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
    status: "approved" | "returned" | "rejected",
    task?: AiAssistantTask,
  ) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const currentRows = useMemo(
    () => createCurrentQueueRows(tasks, notifications, approvals, plannerItems),
    [approvals, notifications, plannerItems, tasks],
  );
  const statusSummary = useMemo(
    () => createTaskStatusSummary(currentRows),
    [currentRows],
  );
  const filteredRows = useMemo(
    () => filterQueueRows(currentRows, searchQuery, statusFilter),
    [currentRows, searchQuery, statusFilter],
  );
  const queueSections = useMemo(
    () => createStatusQueueSections(filteredRows),
    [filteredRows],
  );
  const hasQueueRows = filteredRows.length > 0;

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

  const setDecision = (approvalId: string, status: "approved" | "returned" | "rejected") => {
    const row = currentRows.find((item) => item.approval?.id === approvalId);
    if (!row?.approval) return;
    onSetApprovalDecision(row.approval, status, row.task);
  };

  const returnForRework = (approvalId: string) => {
    setDecision(approvalId, "returned");
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={tasksHeaderStyle}>
        <div>
          <div style={tasksBlockTitleStyle}>Входящие на {formatTaskDateLabel(currentWorkDate)}</div>
          <div style={aiAssistantMutedTextStyle}>Решения, задачи и подготовленные AI-действия без технической таблицы.</div>
        </div>
      </div>

      <div style={tasksToolbarStyle}>
        <input
          aria-label="Поиск по задачам"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Поиск по задачам, тексту, каналу или ответственному"
          style={tasksSearchInputStyle}
        />
        <select
          aria-label="Фильтр по статусу"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TaskStatusFilter)}
          style={tasksStatusSelectStyle}
        >
          {taskStatusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {statusSummary.length > 0 && (
        <div style={statusSummaryStyle}>
          {statusSummary.map((item) => (
            <button
              key={item.status}
              type="button"
              onClick={() => setStatusFilter(item.status)}
              style={{
                ...statusSummaryItemStyle,
                borderColor: statusFilter === item.status ? "#0f172a" : statusSummaryItemStyle.borderColor,
              }}
            >
              <span>{item.label}</span>
              <span>{item.count}</span>
            </button>
          ))}
        </div>
      )}

      {hasQueueRows ? (
        queueSections.map((section) => (
          <TaskQueueSection
            key={section.title}
            title={section.title}
            rows={section.rows}
            editingId={editingId}
            editingText={editingText}
            expandedRowId={expandedRowId}
            onChangeEditingText={setEditingText}
            onOpenRow={(rowId) => setExpandedRowId((current) => (current === rowId ? null : rowId))}
            onReturn={returnForRework}
            onStartEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onDecision={setDecision}
          />
        ))
      ) : (
        <div style={emptyTaskStateStyle}>По выбранным условиям задач нет.</div>
      )}
    </section>
  );
}
