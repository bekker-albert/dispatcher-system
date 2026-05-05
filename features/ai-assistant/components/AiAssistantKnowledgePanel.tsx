"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

type KnowledgeDraft = Omit<AiAssistantKnowledgeSource, "id" | "updatedAt">;

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

  const startCreate = () => {
    setEditingId("new");
    setDraft(createKnowledgeDraft());
  };

  const startEdit = (source: AiAssistantKnowledgeSource) => {
    setEditingId(source.id);
    setDraft(toKnowledgeDraft(source));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(createKnowledgeDraft());
  };

  const saveDraft = () => {
    const normalizedDraft = normalizeKnowledgeDraft(draft);
    if (!normalizedDraft.title || !normalizedDraft.owner) return;

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
        <IconButton label="Добавить источник" onClick={startCreate} tone="primary">
          <Plus size={15} />
        </IconButton>
      </div>

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
                onChange={setDraft}
                onSave={saveDraft}
              />
            )}
            {sources.map((source) => (
              editingId === source.id ? (
                <KnowledgeEditRow
                  key={source.id}
                  draft={draft}
                  onCancel={cancelEdit}
                  onChange={setDraft}
                  onSave={saveDraft}
                />
              ) : (
                <tr key={source.id}>
                  <td style={textTdStyle}>{source.title}</td>
                  <td style={compactTdStyle}>{formatSource(source.source)}</td>
                  <td style={compactTdStyle}>{formatAccess(source.access)}</td>
                  <td style={compactTdStyle}>{source.owner}</td>
                  <td style={textTdStyle}>{source.tags.join(", ")}</td>
                  <td style={compactCenterTdStyle}>
                    <span style={rowActionsStyle}>
                      <IconButton label="Редактировать источник" onClick={() => startEdit(source)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="Удалить источник" onClick={() => deleteSource(source)} tone="danger">
                        <Trash2 size={15} />
                      </IconButton>
                    </span>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KnowledgeEditRow({
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
          <IconButton label="Сохранить источник" onClick={onSave} tone="primary">
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

function IconButton({
  children,
  label,
  onClick,
  tone = "secondary",
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "primary" | "danger" | "secondary";
}) {
  const style = tone === "primary"
    ? primaryIconButtonStyle
    : tone === "danger"
      ? dangerIconButtonStyle
      : secondaryIconButtonStyle;

  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function createKnowledgeDraft(): KnowledgeDraft {
  return {
    title: "",
    source: "manual",
    access: "internal",
    owner: "",
    tags: [],
  };
}

function toKnowledgeDraft(source: AiAssistantKnowledgeSource): KnowledgeDraft {
  return {
    title: source.title,
    source: source.source,
    access: source.access,
    owner: source.owner,
    tags: source.tags,
  };
}

function normalizeKnowledgeDraft(draft: KnowledgeDraft): KnowledgeDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    owner: draft.owner.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
  };
}

function splitTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function formatSource(source: AiAssistantKnowledgeSource["source"]) {
  const labels: Record<AiAssistantKnowledgeSource["source"], string> = {
    manual: "Ручной ввод",
    file: "Файл",
    mail: "Почта",
    documentolog: "Documentolog",
    calendar: "Календарь",
    system: "Система",
  };

  return labels[source];
}

function formatAccess(access: AiAssistantKnowledgeSource["access"]) {
  const labels: Record<AiAssistantKnowledgeSource["access"], string> = {
    public: "Общий",
    internal: "Внутренний",
    restricted: "Ограниченный",
  };

  return labels[access];
}

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const panelTitleStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 900,
  color: "#0f172a",
};

const knowledgeTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 980,
};

const compactThStyle: CSSProperties = {
  ...aiAssistantThStyle,
  whiteSpace: "nowrap",
};

const compactCenterThStyle: CSSProperties = {
  ...compactThStyle,
  textAlign: "center",
};

const textTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  overflowWrap: "anywhere",
};

const compactTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  whiteSpace: "nowrap",
};

const compactCenterTdStyle: CSSProperties = {
  ...compactTdStyle,
  textAlign: "center",
};

const editTdStyle: CSSProperties = {
  ...aiAssistantTdStyle,
  verticalAlign: "top",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 8px",
  font: "inherit",
  fontSize: 13,
};

const rowActionsStyle: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  gap: 5,
  whiteSpace: "nowrap",
};

const baseIconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  cursor: "pointer",
};

const secondaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const primaryIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

const dangerIconButtonStyle: CSSProperties = {
  ...baseIconButtonStyle,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#b91c1c",
};
