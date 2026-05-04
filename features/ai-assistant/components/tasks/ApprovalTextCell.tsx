import type { AiAssistantApprovalAction } from "@/features/ai-assistant/types";
import { approvalTextareaStyle } from "@/features/ai-assistant/components/tasks/taskStyles";

export function ApprovalTextCell({
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
