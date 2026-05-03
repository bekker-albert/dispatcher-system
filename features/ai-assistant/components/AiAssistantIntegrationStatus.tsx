"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import type { AiAssistantIntegration, AiAssistantPermission } from "@/features/ai-assistant/types";
import {
  aiAssistantConnectorStatusLabels,
} from "@/lib/domain/ai-assistant/status";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

type IntegrationDraft = Omit<AiAssistantIntegration, "key">;

export function AiAssistantIntegrationStatus({
  integrations,
  onAddIntegration,
  onUpdateIntegration,
  onDeleteIntegration,
}: {
  integrations: AiAssistantIntegration[];
  onAddIntegration: (integration: IntegrationDraft) => void;
  onUpdateIntegration: (integration: AiAssistantIntegration) => void;
  onDeleteIntegration: (integrationKey: string) => void;
}) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<IntegrationDraft>(() => createIntegrationDraft());

  const startCreate = () => {
    setEditingKey("new");
    setDraft(createIntegrationDraft());
  };

  const startEdit = (integration: AiAssistantIntegration) => {
    setEditingKey(integration.key);
    setDraft(toIntegrationDraft(integration));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(createIntegrationDraft());
  };

  const saveDraft = () => {
    const normalizedDraft = normalizeIntegrationDraft(draft);
    if (!normalizedDraft.title) return;

    if (editingKey === "new") {
      onAddIntegration(normalizedDraft);
    } else if (editingKey) {
      const integration = integrations.find((item) => item.key === editingKey);
      if (integration) {
        onUpdateIntegration({
          ...integration,
          ...normalizedDraft,
        });
      }
    }

    cancelEdit();
  };

  const deleteIntegration = (integration: AiAssistantIntegration) => {
    if (window.confirm(`Удалить интеграцию "${integration.title}"?`)) {
      onDeleteIntegration(integration.key);
      if (editingKey === integration.key) cancelEdit();
    }
  };

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <div style={panelTitleStyle}>Интеграции</div>
          <div style={aiAssistantMutedTextStyle}>Точки подключения ассистента к внешним сервисам.</div>
        </div>
        <IconButton label="Добавить интеграцию" onClick={startCreate} tone="primary">
          <Plus size={15} />
        </IconButton>
      </div>

      <div style={aiAssistantTableWrapStyle}>
        <table style={integrationTableStyle}>
          <colgroup>
            <col style={{ width: "23%" }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: "31%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: 86 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Название</th>
              <th style={compactThStyle}>Статус</th>
              <th style={compactThStyle}>Режим</th>
              <th style={aiAssistantThStyle}>Описание</th>
              <th style={aiAssistantThStyle}>Права</th>
              <th style={compactCenterThStyle}></th>
            </tr>
          </thead>
          <tbody>
            {editingKey === "new" && (
              <IntegrationEditRow
                draft={draft}
                onCancel={cancelEdit}
                onChange={setDraft}
                onSave={saveDraft}
              />
            )}
            {integrations.map((integration) => (
              editingKey === integration.key ? (
                <IntegrationEditRow
                  key={integration.key}
                  draft={draft}
                  onCancel={cancelEdit}
                  onChange={setDraft}
                  onSave={saveDraft}
                />
              ) : (
                <tr key={integration.key}>
                  <td style={textTdStyle}>{integration.title}</td>
                  <td style={compactTdStyle}>{aiAssistantConnectorStatusLabels[integration.status]}</td>
                  <td style={compactTdStyle}>{formatMode(integration.mode)}</td>
                  <td style={textTdStyle}>{integration.description}</td>
                  <td style={textTdStyle}>{integration.requiredScopes.join(", ")}</td>
                  <td style={compactCenterTdStyle}>
                    <span style={rowActionsStyle}>
                      <IconButton label="Редактировать интеграцию" onClick={() => startEdit(integration)}>
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton label="Удалить интеграцию" onClick={() => deleteIntegration(integration)} tone="danger">
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

function IntegrationEditRow({
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

function createIntegrationDraft(): IntegrationDraft {
  return {
    title: "",
    status: "planned",
    mode: "read-write",
    description: "",
    requiredScopes: [],
  };
}

function toIntegrationDraft(integration: AiAssistantIntegration): IntegrationDraft {
  return {
    title: integration.title,
    status: integration.status,
    mode: integration.mode,
    description: integration.description,
    requiredScopes: integration.requiredScopes,
    lastSyncAt: integration.lastSyncAt,
  };
}

function normalizeIntegrationDraft(draft: IntegrationDraft): IntegrationDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    requiredScopes: draft.requiredScopes.map((scope) => scope.trim()).filter(Boolean) as AiAssistantPermission[],
  };
}

function splitScopes(value: string) {
  return value.split(",").map((scope) => scope.trim()).filter(Boolean) as AiAssistantPermission[];
}

function formatMode(mode: AiAssistantIntegration["mode"]) {
  const labels: Record<AiAssistantIntegration["mode"], string> = {
    read: "Чтение",
    write: "Запись",
    "read-write": "Чтение и запись",
  };

  return labels[mode];
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

const integrationTableStyle: CSSProperties = {
  ...aiAssistantTableStyle,
  tableLayout: "fixed",
  minWidth: 1080,
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

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 58,
  resize: "vertical",
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
