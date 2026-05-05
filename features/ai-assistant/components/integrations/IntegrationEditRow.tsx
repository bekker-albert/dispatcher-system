import { Check, X } from "lucide-react";

import type { AiAssistantIntegration } from "@/features/ai-assistant/types";

import { IconButton } from "./IconButton";
import type { IntegrationDraft } from "./integrationModel";
import { splitList, splitScopes } from "./integrationModel";
import {
  compactCenterTdStyle,
  editTdStyle,
  inputStyle,
  rowActionsStyle,
  textareaStyle,
} from "./integrationStyles";

export function IntegrationEditRow({
  draft,
  onCancel,
  onChange,
  onSave,
}: {
  draft: IntegrationDraft;
  onCancel: () => void;
  onChange: (draft: IntegrationDraft) => void;
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
          aria-label="Статус"
          value={draft.status}
          onChange={(event) => onChange({ ...draft, status: event.target.value as AiAssistantIntegration["status"] })}
          style={inputStyle}
        >
          <option value="planned">Планируется</option>
          <option value="disabled">Отключено</option>
          <option value="connected">Подключено</option>
          <option value="error">Ошибка</option>
        </select>
      </td>
      <td style={editTdStyle}>
        <select
          aria-label="Режим"
          value={draft.mode}
          onChange={(event) => onChange({ ...draft, mode: event.target.value as AiAssistantIntegration["mode"] })}
          style={inputStyle}
        >
          <option value="read">Чтение</option>
          <option value="write">Запись</option>
          <option value="read-write">Чтение и запись</option>
        </select>
      </td>
      <td style={editTdStyle}>
        <textarea
          aria-label="Описание"
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          style={textareaStyle}
        />
      </td>
      <td style={editTdStyle}>
        <textarea
          aria-label="Возможности"
          value={draft.availableCapabilities?.join(", ") ?? ""}
          onChange={(event) => onChange({ ...draft, availableCapabilities: splitList(event.target.value) })}
          style={textareaStyle}
        />
      </td>
      <td style={editTdStyle}>
        <textarea
          aria-label="Заглушка"
          value={draft.stubNotes ?? ""}
          onChange={(event) => onChange({ ...draft, stubNotes: event.target.value })}
          style={textareaStyle}
        />
      </td>
      <td style={editTdStyle}>
        <textarea
          aria-label="Следующий шаг"
          value={draft.nextStep ?? ""}
          onChange={(event) => onChange({ ...draft, nextStep: event.target.value })}
          style={textareaStyle}
        />
      </td>
      <td style={editTdStyle}>
        <textarea
          aria-label="Права"
          value={draft.requiredScopes.join(", ")}
          onChange={(event) => onChange({ ...draft, requiredScopes: splitScopes(event.target.value) })}
          style={textareaStyle}
        />
      </td>
      <td style={compactCenterTdStyle}>
        <span style={rowActionsStyle}>
          <IconButton label="Сохранить интеграцию" onClick={onSave} tone="primary">
            <Check size={15} />
          </IconButton>
          <IconButton label="Отмена" onClick={onCancel}>
            <X size={15} />
          </IconButton>
        </span>
      </td>
    </tr>
  );
}
