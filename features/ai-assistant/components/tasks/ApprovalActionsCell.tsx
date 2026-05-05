import { Check, Pencil, X } from "lucide-react";

import type { AiAssistantApprovalAction } from "@/features/ai-assistant/types";
import { TaskActionButton } from "@/features/ai-assistant/components/tasks/TaskActionButton";
import { iconActionsStyle } from "@/features/ai-assistant/components/tasks/taskStyles";

export function ApprovalActionsCell({
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
  onDecision: (approvalId: string, status: "approved" | "returned" | "rejected") => void;
}) {
  if (editingId === approval.id) {
    return (
      <div style={iconActionsStyle}>
        <TaskActionButton label="Сохранить" tone="primary" onClick={() => onSave(approval.id)}>
          <Check size={15} />
          <span>Сохранить</span>
        </TaskActionButton>
        <TaskActionButton label="Отмена" onClick={onCancel}>
          <X size={15} />
          <span>Отмена</span>
        </TaskActionButton>
      </div>
    );
  }

  if (approval.status !== "required") return null;

  return (
    <div style={iconActionsStyle}>
      <TaskActionButton label="Согласовать" tone="primary" onClick={() => onDecision(approval.id, "approved")}>
        <Check size={15} />
        <span>Согласовать</span>
      </TaskActionButton>
      <TaskActionButton label="Отказать" tone="danger" onClick={() => onDecision(approval.id, "rejected")}>
        <X size={15} />
        <span>Отказать</span>
      </TaskActionButton>
      <TaskActionButton label="Редактировать" onClick={() => onStartEdit(approval)}>
        <Pencil size={15} />
        <span>Редактировать</span>
      </TaskActionButton>
      <TaskActionButton label="Вернуть на доработку" onClick={() => onDecision(approval.id, "returned")}>
        <X size={15} />
        <span>Доработать</span>
      </TaskActionButton>
    </div>
  );
}
