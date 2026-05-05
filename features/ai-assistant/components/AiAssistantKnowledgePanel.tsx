"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableWrapStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import { KnowledgeEditRow } from "./knowledge/KnowledgeEditRow";
import { KnowledgeIconButton } from "./knowledge/KnowledgeIconButton";
import { KnowledgeViewRow } from "./knowledge/KnowledgeViewRow";
import type { KnowledgeDraft } from "./knowledge/knowledgeDrafts";
import {
  createKnowledgeDraft,
  normalizeKnowledgeDraft,
  toKnowledgeDraft,
} from "./knowledge/knowledgeDrafts";
import {
  compactCenterThStyle,
  compactThStyle,
  knowledgeTableStyle,
  panelHeaderStyle,
  panelTitleStyle,
  validationErrorStyle,
} from "./knowledge/knowledgeStyles";

export function AiAssistantKnowledgePanel({
  sources,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
}: {
  sources: AiAssistantKnowledgeSource[];
  onAddSource: (source: KnowledgeDraft) => void;
  onUpdateSource: (source: AiAssistantKnowledgeSource) => void;
  onDeleteSource: (sourceId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<KnowledgeDraft>(() => createKnowledgeDraft());
  const [validationError, setValidationError] = useState("");

  const startCreate = () => {
    setEditingId("new");
    setDraft(createKnowledgeDraft());
    setValidationError("");
  };

  const startEdit = (source: AiAssistantKnowledgeSource) => {
    setEditingId(source.id);
    setDraft(toKnowledgeDraft(source));
    setValidationError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(createKnowledgeDraft());
    setValidationError("");
  };

  const handleDraftChange = (nextDraft: KnowledgeDraft) => {
    setDraft(nextDraft);
    if (validationError) setValidationError("");
  };

  const saveDraft = () => {
    const normalizedDraft = normalizeKnowledgeDraft(draft);
    if (!normalizedDraft.title || !normalizedDraft.owner) {
      setValidationError(
        !normalizedDraft.title
          ? "Укажите название источника."
          : "Укажите владельца источника.",
      );
      return;
    }

    if (editingId === "new") {
      onAddSource(normalizedDraft);
    } else if (editingId) {
      const source = sources.find((item) => item.id === editingId);
      if (source) {
        onUpdateSource({
          ...source,
          ...normalizedDraft,
        });
      }
    }

    cancelEdit();
  };

  const deleteSource = (source: AiAssistantKnowledgeSource) => {
    if (window.confirm(`Удалить источник знаний "${source.title}"?`)) {
      onDeleteSource(source.id);
      if (editingId === source.id) cancelEdit();
    }
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <div style={panelTitleStyle}>База знаний</div>
          <div style={aiAssistantMutedTextStyle}>Источники, которые ассистент будет использовать для ответов.</div>
        </div>
        <KnowledgeIconButton label="Добавить источник" onClick={startCreate} tone="primary">
          <Plus size={15} />
        </KnowledgeIconButton>
      </div>
      {validationError && <div style={validationErrorStyle}>{validationError}</div>}

      <div style={aiAssistantTableWrapStyle}>
        <table style={knowledgeTableStyle}>
          <colgroup>
            <col style={{ width: "32%" }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: 86 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Название</th>
              <th style={compactThStyle}>Источник</th>
              <th style={compactThStyle}>Доступ</th>
              <th style={compactThStyle}>Владелец</th>
              <th style={aiAssistantThStyle}>Метки</th>
              <th style={compactCenterThStyle}></th>
            </tr>
          </thead>
          <tbody>
            {editingId === "new" && (
              <KnowledgeEditRow
                draft={draft}
                onCancel={cancelEdit}
                onChange={handleDraftChange}
                onSave={saveDraft}
              />
            )}
            {sources.map((source) => (
              editingId === source.id ? (
                <KnowledgeEditRow
                  key={source.id}
                  draft={draft}
                  onCancel={cancelEdit}
                  onChange={handleDraftChange}
                  onSave={saveDraft}
                />
              ) : (
                <KnowledgeViewRow
                  key={source.id}
                  onDelete={deleteSource}
                  onEdit={startEdit}
                  source={source}
                />
              )
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
