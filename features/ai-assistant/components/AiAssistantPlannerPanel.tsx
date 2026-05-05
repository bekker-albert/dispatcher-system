"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import { PlannerCalendar } from "@/features/ai-assistant/components/planner/PlannerCalendar";
import { PlannerDayTasks } from "@/features/ai-assistant/components/planner/PlannerDayTasks";
import {
  createPlannerDraft,
  normalizePlannerDraft,
  type PlannerDraft,
} from "@/features/ai-assistant/components/planner/plannerDraft";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import {
  createPlannerCalendarDays,
  getPlannerMonthKey,
  shiftPlannerMonth,
} from "@/features/ai-assistant/components/planner/plannerCalendarModel";
import { formatPlannerDateLabel } from "@/features/ai-assistant/components/planner/plannerFormatters";
import {
  plannerCalendarLayoutStyle,
  plannerHeaderStyle,
} from "@/features/ai-assistant/components/planner/plannerStyles";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import { requiresAiAssistantApproval } from "@/lib/domain/ai-assistant/approval-policy";

export function AiAssistantPlannerPanel({
  currentWorkDate,
  plannerItems,
  onChangePlannerItems,
}: {
  currentWorkDate: string;
  plannerItems: AiAssistantPlannerItem[];
  onChangePlannerItems: Dispatch<SetStateAction<AiAssistantPlannerItem[]>>;
}) {
  return (
    <AiAssistantPlannerPanelContent
      key={currentWorkDate}
      currentWorkDate={currentWorkDate}
      plannerItems={plannerItems}
      onChangePlannerItems={onChangePlannerItems}
    />
  );
}

function AiAssistantPlannerPanelContent({
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
  const [selectedDate, setSelectedDate] = useState(currentWorkDate);
  const [calendarMonth, setCalendarMonth] = useState(() => getPlannerMonthKey(currentWorkDate));

  const sortedItems = useMemo(
    () => [...plannerItems].sort((a, b) => `${a.plannedDate} ${a.plannedTime ?? ""}`.localeCompare(`${b.plannedDate} ${b.plannedTime ?? ""}`)),
    [plannerItems],
  );
  const selectedDateItems = useMemo(
    () => sortedItems.filter((item) => item.plannedDate === selectedDate),
    [selectedDate, sortedItems],
  );
  const calendarDays = useMemo(
    () => createPlannerCalendarDays({
      currentWorkDate,
      items: plannerItems,
      monthKey: calendarMonth,
    }),
    [calendarMonth, currentWorkDate, plannerItems],
  );

  const startCreate = (date = selectedDate) => {
    setSelectedDate(date);
    setCalendarMonth(getPlannerMonthKey(date));
    setEditingId("new");
    setDraft(createPlannerDraft(date));
  };

  const startEdit = (item: AiAssistantPlannerItem) => {
    setSelectedDate(item.plannedDate);
    setCalendarMonth(getPlannerMonthKey(item.plannedDate));
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

  const finishEdit = (date = selectedDate) => {
    setEditingId(null);
    setDraft(createPlannerDraft(date));
  };

  const cancelEdit = () => {
    finishEdit();
  };

  const saveDraft = () => {
    const normalizedDraft = normalizePlannerDraft(draft);
    if (!normalizedDraft.title || !normalizedDraft.target) return;
    const safeDraft = {
      ...normalizedDraft,
      requireApproval: normalizedDraft.requireApproval
        || requiresAiAssistantApproval(
          normalizedDraft.actionType,
          normalizedDraft.requireApproval ? "critical" : "low",
          normalizedDraft.channel,
        ),
    };

    if (editingId === "new") {
      onChangePlannerItems((current) => [
        ...current,
        {
          id: `plan-ai-${Date.now()}`,
          ...safeDraft,
          owner: "Текущий пользователь",
          updatedAt: new Date().toISOString(),
        },
      ]);
      setSelectedDate(safeDraft.plannedDate);
      setCalendarMonth(getPlannerMonthKey(safeDraft.plannedDate));
    } else if (editingId) {
      onChangePlannerItems((current) => current.map((item) => (
        item.id === editingId
          ? { ...item, ...safeDraft, updatedAt: new Date().toISOString() }
          : item
      )));
      setSelectedDate(safeDraft.plannedDate);
      setCalendarMonth(getPlannerMonthKey(safeDraft.plannedDate));
    }

    finishEdit(safeDraft.plannedDate);
  };

  const setPlannerDecision = (item: AiAssistantPlannerItem, decision: "approved" | "rejected") => {
    const needsApproval = item.requireApproval
      || requiresAiAssistantApproval(
        item.actionType,
        item.requireApproval ? "critical" : "low",
        item.channel,
      );

    if (needsApproval) {
      onChangePlannerItems((current) => current.map((currentItem) => (
        currentItem.id === item.id
          ? {
              ...currentItem,
              status: "needs-decision",
              requireApproval: true,
              comment: "Требуется решение в очереди задач",
              updatedAt: new Date().toISOString(),
            }
          : currentItem
      )));
      return;
    }

    onChangePlannerItems((current) => current.map((currentItem) => (
      currentItem.id === item.id
        ? {
            ...currentItem,
            status: decision === "approved" ? "done" : "cancelled",
            requireApproval: false,
            comment: decision === "approved" ? "Согласовано на сайте" : "Отклонено на сайте",
            updatedAt: new Date().toISOString(),
          }
        : currentItem
    )));
    if (editingId === item.id) cancelEdit();
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

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setCalendarMonth(getPlannerMonthKey(date));
    if (!editingId) setDraft(createPlannerDraft(date));
  };

  const changeMonth = (offset: number) => {
    setCalendarMonth((current) => shiftPlannerMonth(current, offset));
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={plannerHeaderStyle}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a" }}>Планировщик</div>
          <div style={aiAssistantMutedTextStyle}>Рабочая дата: {formatPlannerDateLabel(currentWorkDate)}</div>
        </div>
        <PlannerIconButton label="Добавить задачу" onClick={() => startCreate()}>
          <Plus size={15} />
        </PlannerIconButton>
      </div>

      <div style={plannerCalendarLayoutStyle}>
        <PlannerCalendar
          currentWorkDate={currentWorkDate}
          days={calendarDays}
          monthKey={calendarMonth}
          selectedDate={selectedDate}
          onChangeMonth={changeMonth}
          onSelectDate={selectDate}
        />
        <PlannerDayTasks
          draft={draft}
          editingId={editingId}
          items={selectedDateItems}
          selectedDate={selectedDate}
          onCancelEdit={cancelEdit}
          onChangeDraft={setDraft}
          onDeleteItem={deleteItem}
          onSaveDraft={saveDraft}
          onSetPlannerDecision={setPlannerDecision}
          onStartCreate={() => startCreate(selectedDate)}
          onStartEdit={startEdit}
        />
      </div>
    </section>
  );
}
