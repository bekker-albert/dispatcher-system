import { AiAssistantStatusPill } from "@/features/ai-assistant/components/AiAssistantStatusPill";
import { ApprovalActionsCell } from "@/features/ai-assistant/components/tasks/ApprovalActionsCell";
import { ApprovalTextCell } from "@/features/ai-assistant/components/tasks/ApprovalTextCell";
import type { CurrentQueueRow } from "@/features/ai-assistant/components/tasks/taskQueue";
import {
  aiAssistantMultilineTdStyle,
  aiAssistantTextTdStyle,
  compactCenterTdStyle,
  compactCenterThStyle,
  compactTdStyle,
  compactThStyle,
  emptyTdStyle,
  queueSectionTitleStyle,
  tasksBlockStyle,
  tasksTableStyle,
} from "@/features/ai-assistant/components/tasks/taskStyles";
import { formatAiAssistantChannel } from "@/features/ai-assistant/lib/formatters";
import type { AiAssistantApprovalAction } from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantTableWrapStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function TaskQueueSection({
  title,
  rows,
  editingId,
  editingText,
  onChangeEditingText,
  onStartEdit,
  onSave,
  onCancel,
  onDecision,
}: {
  title: string;
  rows: CurrentQueueRow[];
  editingId: string | null;
  editingText: string;
  onChangeEditingText: (value: string) => void;
  onStartEdit: (approval: AiAssistantApprovalAction) => void;
  onSave: (approvalId: string) => void;
  onCancel: () => void;
  onDecision: (approvalId: string, status: "approved" | "rejected") => void;
}) {
  return (
    <div style={tasksBlockStyle}>
      <div style={queueSectionTitleStyle}>{title}</div>
      <div style={aiAssistantTableWrapStyle}>
        <table style={tasksTableStyle}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: 98 }} />
            <col style={{ width: 132 }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: 210 }} />
          </colgroup>
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
            {rows.length === 0 && (
              <tr>
                <td style={emptyTdStyle} colSpan={5}>Нет записей</td>
              </tr>
            )}
            {rows.map((row) => (
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
                      onChangeText={onChangeEditingText}
                    />
                  ) : row.text}
                </td>
                <td style={compactCenterTdStyle}>
                  {row.approval && (
                    <ApprovalActionsCell
                      approval={row.approval}
                      editingId={editingId}
                      onStartEdit={onStartEdit}
                      onSave={onSave}
                      onCancel={onCancel}
                      onDecision={onDecision}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
