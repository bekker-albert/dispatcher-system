import { Pencil, Trash2 } from "lucide-react";

import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";

import { KnowledgeIconButton } from "./KnowledgeIconButton";
import { formatAccess, formatSource } from "./knowledgeDrafts";
import {
  compactCenterTdStyle,
  compactTdStyle,
  rowActionsStyle,
  textTdStyle,
} from "./knowledgeStyles";

export function KnowledgeViewRow({
  onDelete,
  onEdit,
  source,
}: {
  onDelete: (source: AiAssistantKnowledgeSource) => void;
  onEdit: (source: AiAssistantKnowledgeSource) => void;
  source: AiAssistantKnowledgeSource;
}) {
  return (
    <tr>
      <td style={textTdStyle}>{source.title}</td>
      <td style={compactTdStyle}>{formatSource(source.source)}</td>
      <td style={compactTdStyle}>{formatAccess(source.access)}</td>
      <td style={compactTdStyle}>{source.owner}</td>
      <td style={textTdStyle}>{source.tags.join(", ")}</td>
      <td style={compactCenterTdStyle}>
        <span style={rowActionsStyle}>
          <KnowledgeIconButton label="Редактировать источник" onClick={() => onEdit(source)}>
            <Pencil size={15} />
          </KnowledgeIconButton>
          <KnowledgeIconButton label="Удалить источник" onClick={() => onDelete(source)} tone="danger">
            <Trash2 size={15} />
          </KnowledgeIconButton>
        </span>
      </td>
    </tr>
  );
}
