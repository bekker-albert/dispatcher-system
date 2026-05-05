"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import type { AiAssistantIntegration } from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableWrapStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";
import { IconButton } from "./integrations/IconButton";
import { IntegrationEditRow } from "./integrations/IntegrationEditRow";
import { IntegrationViewRow } from "./integrations/IntegrationViewRow";
import type { IntegrationDraft } from "./integrations/integrationModel";
import {
  createIntegrationDraft,
  normalizeIntegrationDraft,
  toIntegrationDraft,
} from "./integrations/integrationModel";
import {
  compactCenterThStyle,
  compactThStyle,
  integrationTableStyle,
  panelHeaderStyle,
  panelTitleStyle,
  validationErrorStyle,
} from "./integrations/integrationStyles";


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
  const [validationError, setValidationError] = useState("");

  const startCreate = () => {
    setEditingKey("new");
    setDraft(createIntegrationDraft());
    setValidationError("");
  };

  const startEdit = (integration: AiAssistantIntegration) => {
    setEditingKey(integration.key);
    setDraft(toIntegrationDraft(integration));
    setValidationError("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setDraft(createIntegrationDraft());
    setValidationError("");
  };

  const handleDraftChange = (nextDraft: IntegrationDraft) => {
    setDraft(nextDraft);
    if (validationError) setValidationError("");
  };

  const saveDraft = () => {
    const normalizedDraft = normalizeIntegrationDraft(draft);
    if (!normalizedDraft.title) {
      setValidationError("Укажите название интеграции.");
      return;
    }

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
      {validationError && <div style={validationErrorStyle}>{validationError}</div>}

      <div style={aiAssistantTableWrapStyle}>
        <table style={integrationTableStyle}>
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: 86 }} />
          </colgroup>
          <thead>
            <tr>
              <th style={aiAssistantThStyle}>Название</th>
              <th style={compactThStyle}>Статус</th>
              <th style={compactThStyle}>Режим</th>
              <th style={aiAssistantThStyle}>Описание</th>
              <th style={aiAssistantThStyle}>Возможности</th>
              <th style={aiAssistantThStyle}>Заглушка</th>
              <th style={aiAssistantThStyle}>Следующий шаг</th>
              <th style={aiAssistantThStyle}>Права</th>
              <th style={compactCenterThStyle}></th>
            </tr>
          </thead>
          <tbody>
            {editingKey === "new" && (
              <IntegrationEditRow
                draft={draft}
                onCancel={cancelEdit}
                onChange={handleDraftChange}
                onSave={saveDraft}
              />
            )}
            {integrations.map((integration) => (
              editingKey === integration.key ? (
                <IntegrationEditRow
                  key={integration.key}
                  draft={draft}
                  onCancel={cancelEdit}
                  onChange={handleDraftChange}
                  onSave={saveDraft}
                />
              ) : (
                <IntegrationViewRow
                  key={integration.key}
                  integration={integration}
                  onDelete={deleteIntegration}
                  onEdit={startEdit}
                />
              )
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
