import { Check, X } from "lucide-react";

import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";

import { KnowledgeIconButton } from "./KnowledgeIconButton";
import type { KnowledgeDraft } from "./knowledgeDrafts";
import { splitTags } from "./knowledgeDrafts";
import {
  compactCenterTdStyle,
  editTdStyle,
  inputStyle,
  rowActionsStyle,
} from "./knowledgeStyles";

export function KnowledgeEditRow({
  draft,
  onCancel,
  onChange,
  onSave,
}: {
  draft: KnowledgeDraft;
  onCancel: () => void;
  onChange: (draft: KnowledgeDraft) => void;
  onSave: () => void;
}) {
  return (
    <tr>
      <td style={editTdStyle}>
        <input
          aria-label="Название"
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.target.value })}
          style={inputStyle}
        />
      </td>
      <td style={editTdStyle}>
        <select
          aria-label="Источник"
          value={draft.source}
          onChange={(event) => onChange({ ...draft, source: event.target.value as AiAssistantKnowledgeSource["source"] })}
          style={inputStyle}
        >
          <option value="manual">Ручной ввод</option>
          <option value="file">Файл</option>
          <option value="mail">Почта</option>
          <option value="documentolog">Documentolog</option>
          <option value="calendar">Календарь</option>
          <option value="system">Система</option>
        </select>
      </td>
      <td style={editTdStyle}>
        <select
          aria-label="Доступ"
          value={draft.access}
          onChange={(event) => onChange({ ...draft, access: event.target.value as AiAssistantKnowledgeSource["access"] })}
          style={inputStyle}
        >
          <option value="public">Общий</option>
          <option value="internal">Внутренний</option>
          <option value="restricted">Ограниченный</option>
        </select>
      </td>
      <td style={editTdStyle}>
        <input
          aria-label="Владелец"
          value={draft.owner}
          onChange={(event) => onChange({ ...draft, owner: event.target.value })}
          style={inputStyle}
        />
      </td>
      <td style={editTdStyle}>
        <input
          aria-label="Метки"
          value={draft.tags.join(", ")}
          onChange={(event) => onChange({ ...draft, tags: splitTags(event.target.value) })}
          style={inputStyle}
        />
      </td>
      <td style={compactCenterTdStyle}>
        <span style={rowActionsStyle}>
          <KnowledgeIconButton label="Сохранить источник" onClick={onSave} tone="primary">
            <Check size={15} />
          </KnowledgeIconButton>
          <KnowledgeIconButton label="Отмена" onClick={onCancel}>
            <X size={15} />
          </KnowledgeIconButton>
        </span>
      </td>
    </tr>
  );
}
