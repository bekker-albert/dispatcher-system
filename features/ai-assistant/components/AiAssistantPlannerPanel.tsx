"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import {
  createPlannerDraft,
  normalizePlannerDraft,
  type PlannerDraft,
} from "@/features/ai-assistant/components/planner/plannerDraft";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import { PlannerTable } from "@/features/ai-assistant/components/planner/PlannerTable";
import { formatPlannerDateLabel } from "@/features/ai-assistant/components/planner/plannerFormatters";
import { plannerHeaderStyle } from "@/features/ai-assistant/components/planner/plannerStyles";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

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
    const normalizedDraft = normalizePlannerDraft(draft);
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
          <div style={aiAssistantMutedTextStyle}>Рабочая дата: {formatPlannerDateLabel(currentWorkDate)}</div>
        </div>
        <PlannerIconButton label="Добавить задачу" onClick={startCreate}>
          <Plus size={15} />
        </PlannerIconButton>
      </div>
      <PlannerTable
        draft={draft}
        editingId={editingId}
        items={sortedItems}
        onCancelEdit={cancelEdit}
        onChangeDraft={setDraft}
        onDeleteItem={deleteItem}
        onSaveDraft={saveDraft}
        onStartEdit={startEdit}
      />
    </section>
  );
}
