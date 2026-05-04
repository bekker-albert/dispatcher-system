"use client";

import { Pencil, Trash2 } from "lucide-react";

import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";
import type { PlannerDraft } from "@/features/ai-assistant/components/planner/plannerDraft";
import { PlannerEditRow } from "@/features/ai-assistant/components/planner/PlannerEditRow";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import {
  aiAssistantTextTdStyle,
  compactCenterTdStyle,
  compactCenterThStyle,
  compactTdStyle,
  compactThStyle,
  plannerActionsColumnStyle,
  plannerActionsStyle,
  plannerDateColumnStyle,
  plannerExecutionColumnStyle,
  plannerPlanColumnStyle,
  plannerPriorityColumnStyle,
  plannerRecipientColumnStyle,
  plannerRecipientViewTdStyle,
  plannerStatusColumnStyle,
  plannerTableStyle,
} from "@/features/ai-assistant/components/planner/plannerStyles";
import {
  aiAssistantMutedTextStyle,
  aiAssistantTableWrapStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import {
  formatPlannerActionType,
  formatPlannerDateLabel,
  formatPlannerPriority,
  formatPlannerRecurrence,
  formatPlannerStatus,
} from "@/features/ai-assistant/components/planner/plannerFormatters";

export function PlannerTable({
  draft,
  editingId,
  items,
  onCancelEdit,
  onChangeDraft,
  onDeleteItem,
  onSaveDraft,
  onStartEdit,
}: {
  draft: PlannerDraft;
  editingId: string | null;
  items: AiAssistantPlannerItem[];
  onCancelEdit: () => void;
  onChangeDraft: (draft: PlannerDraft) => void;
  onDeleteItem: (item: AiAssistantPlannerItem) => void;
  onSaveDraft: () => void;
  onStartEdit: (item: AiAssistantPlannerItem) => void;
}) {
  return (
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
              onChange={onChangeDraft}
              onSave={onSaveDraft}
              onCancel={onCancelEdit}
            />
          )}
          {items.map((item) => (
            editingId === item.id ? (
              <PlannerEditRow
                key={item.id}
                draft={draft}
                onChange={onChangeDraft}
                onSave={onSaveDraft}
                onCancel={onCancelEdit}
              />
            ) : (
              <PlannerViewRow
                key={item.id}
                item={item}
                onDeleteItem={onDeleteItem}
                onStartEdit={onStartEdit}
              />
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlannerViewRow({
  item,
  onDeleteItem,
  onStartEdit,
}: {
  item: AiAssistantPlannerItem;
  onDeleteItem: (item: AiAssistantPlannerItem) => void;
  onStartEdit: (item: AiAssistantPlannerItem) => void;
}) {
  return (
    <tr>
      <td style={compactTdStyle}>
        <div style={{ fontWeight: 900 }}>{formatPlannerDateLabel(item.plannedDate)}</div>
        {item.plannedTime && <div style={aiAssistantMutedTextStyle}>{item.plannedTime}</div>}
        {item.recurrence && item.recurrence.type !== "none" && (
          <div style={aiAssistantMutedTextStyle}>{formatPlannerRecurrence(item.recurrence)}</div>
        )}
      </td>
      <td style={aiAssistantTextTdStyle}>
        <div style={{ fontWeight: 900 }}>{item.title}</div>
        <div style={aiAssistantMutedTextStyle}>{item.description}</div>
        {item.comment && <div style={aiAssistantMutedTextStyle}>{item.comment}</div>}
      </td>
      <td style={aiAssistantTextTdStyle}>
        <div style={{ fontWeight: 900 }}>{formatPlannerActionType(item.actionType)}</div>
        <div style={aiAssistantMutedTextStyle}>{item.preparedText}</div>
        {item.requireApproval && <div style={aiAssistantMutedTextStyle}>Требует решения перед выполнением</div>}
      </td>
      <td style={plannerRecipientViewTdStyle}>
        <div style={{ fontWeight: 900 }}>{item.target}</div>
        <div style={aiAssistantMutedTextStyle}>{formatAiAssistantChannel(item.channel)}</div>
      </td>
      <td style={compactTdStyle}>{formatPlannerPriority(item.priority)}</td>
      <td style={compactTdStyle}>{formatPlannerStatus(item.status)}</td>
      <td style={compactCenterTdStyle}>
        <span style={plannerActionsStyle}>
          <PlannerIconButton label="Редактировать задачу" onClick={() => onStartEdit(item)}>
            <Pencil size={15} />
          </PlannerIconButton>
          <PlannerIconButton label="Удалить задачу" tone="danger" onClick={() => onDeleteItem(item)}>
            <Trash2 size={15} />
          </PlannerIconButton>
        </span>
      </td>
    </tr>
  );
}
