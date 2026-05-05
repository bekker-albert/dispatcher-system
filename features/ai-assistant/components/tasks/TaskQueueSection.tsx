import { TaskCards } from "@/features/ai-assistant/components/tasks/TaskCards";
import type { CurrentQueueRow } from "@/features/ai-assistant/components/tasks/taskQueue";
import {
  queueSectionTitleStyle,
  tasksBlockStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";
import type { AiAssistantApprovalAction } from "@/features/ai-assistant/types";

export function TaskQueueSection({
  title,
  rows,
  editingId,
  editingText,
  expandedRowId,
  onChangeEditingText,
  onOpenRow,
  onReturn,
  onStartEdit,
  onSave,
  onCancel,
  onDecision,
}: {
  title: string;
  rows: CurrentQueueRow[];
  editingId: string | null;
  editingText: string;
  expandedRowId: string | null;
  onChangeEditingText: (value: string) => void;
  onOpenRow: (rowId: string) => void;
  onReturn: (approvalId: string) => void;
  onStartEdit: (approval: AiAssistantApprovalAction) => void;
  onSave: (approvalId: string) => void;
  onCancel: () => void;
  onDecision: (approvalId: string, status: "approved" | "rejected") => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div style={tasksBlockStyle}>
      <div style={queueSectionTitleStyle}>{title}</div>
      <TaskCards
        rows={rows}
        editingId={editingId}
        editingText={editingText}
        expandedRowId={expandedRowId}
        onCancel={onCancel}
        onChangeEditingText={onChangeEditingText}
        onDecision={onDecision}
        onOpenRow={onOpenRow}
        onReturn={onReturn}
        onSave={onSave}
        onStartEdit={onStartEdit}
      />
    </div>
  );
}
