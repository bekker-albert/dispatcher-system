"use client";

import { Check, Eye, Pencil, RotateCcw, X } from "lucide-react";

import { AiAssistantStatusPill } from "@/features/ai-assistant/components/AiAssistantStatusPill";
import { ApprovalTextCell } from "@/features/ai-assistant/components/tasks/ApprovalTextCell";
import { TaskActionButton } from "@/features/ai-assistant/components/tasks/TaskActionButton";
import type { CurrentQueueRow } from "@/features/ai-assistant/components/tasks/taskQueue";
import {
  aiAssistantTextTdStyle,
  iconActionsStyle,
  taskCardMetaStyle,
  taskCardsStyle,
  taskCardStyle,
  taskCardTextStyle,
  taskCardTopStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";
import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type { AiAssistantApprovalAction } from "@/features/ai-assistant/types";
import { aiAssistantMutedTextStyle } from "@/features/ai-assistant/aiAssistantStyles";

export function TaskCards({
  editingId,
  editingText,
  expandedRowId,
  rows,
  onCancel,
  onChangeEditingText,
  onDecision,
  onOpenRow,
  onReturn,
  onSave,
  onStartEdit,
}: {
  editingId: string | null;
  editingText: string;
  expandedRowId: string | null;
  rows: CurrentQueueRow[];
  onCancel: () => void;
  onChangeEditingText: (value: string) => void;
  onDecision: (approvalId: string, status: "approved" | "rejected") => void;
  onOpenRow: (rowId: string) => void;
  onReturn: (approvalId: string) => void;
  onSave: (approvalId: string) => void;
  onStartEdit: (approval: AiAssistantApprovalAction) => void;
}) {
  return (
    <div style={taskCardsStyle}>
      {rows.map((row) => {
        const isExpanded = expandedRowId === row.id;
        const canDecide = row.approval?.status === "required";

        return (
          <div key={row.id} style={taskCardStyle}>
            <div style={taskCardTopStyle}>
              <div style={aiAssistantTextTdStyle}>
                <div style={{ fontWeight: 900 }}>{row.title}</div>
                {row.details && <div style={aiAssistantMutedTextStyle}>{row.details}</div>}
              </div>
              <div style={taskCardMetaStyle}>
                <span style={aiAssistantMutedTextStyle}>{formatAiAssistantChannel(row.channel)}</span>
                <AiAssistantStatusPill status={row.status} />
              </div>
            </div>

            <div style={taskCardTextStyle}>
              {row.approval ? (
                <ApprovalTextCell
                  approval={row.approval}
                  editingId={editingId}
                  editingText={editingText}
                  fallbackText={row.text}
                  onChangeText={onChangeEditingText}
                />
              ) : (
                isExpanded ? row.text : trimTaskText(row.text)
              )}
            </div>

            <div style={iconActionsStyle}>
              <TaskActionButton label="Открыть" onClick={() => onOpenRow(row.id)}>
                <Eye size={15} />
                <span>Открыть</span>
              </TaskActionButton>
              {row.approval && editingId === row.approval.id ? (
                <>
                  <TaskActionButton label="Сохранить" tone="primary" onClick={() => onSave(row.approval!.id)}>
                    <Check size={15} />
                    <span>Сохранить</span>
                  </TaskActionButton>
                  <TaskActionButton label="Отмена" onClick={onCancel}>
                    <X size={15} />
                    <span>Отмена</span>
                  </TaskActionButton>
                </>
              ) : (
                <>
                  {canDecide && (
                    <TaskActionButton label="Согласовать" tone="primary" onClick={() => onDecision(row.approval!.id, "approved")}>
                      <Check size={15} />
                      <span>Согласовать</span>
                    </TaskActionButton>
                  )}
                  {canDecide && row.approval && (
                    <TaskActionButton label="Редактировать" onClick={() => onStartEdit(row.approval!)}>
                      <Pencil size={15} />
                      <span>Редактировать</span>
                    </TaskActionButton>
                  )}
                  {canDecide && (
                    <>
                      <TaskActionButton label="Вернуть на доработку" onClick={() => onReturn(row.approval!.id)}>
                        <RotateCcw size={15} />
                        <span>Вернуть</span>
                      </TaskActionButton>
                      <TaskActionButton label="Отказать" tone="danger" onClick={() => onDecision(row.approval!.id, "rejected")}>
                        <X size={15} />
                        <span>Отказать</span>
                      </TaskActionButton>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function trimTaskText(value: string) {
  if (value.length <= 180) return value;
  return `${value.slice(0, 180)}...`;
}
