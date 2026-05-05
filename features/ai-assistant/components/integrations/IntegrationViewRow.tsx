import { Pencil, Trash2 } from "lucide-react";

import type { AiAssistantIntegration } from "@/features/ai-assistant/types";
import { aiAssistantConnectorStatusLabels } from "@/lib/domain/ai-assistant/status";

import { IconButton } from "./IconButton";
import { formatMode } from "./integrationModel";
import {
  compactCenterTdStyle,
  compactTdStyle,
  rowActionsStyle,
  textTdStyle,
} from "./integrationStyles";

export function IntegrationViewRow({
  integration,
  onDelete,
  onEdit,
}: {
  integration: AiAssistantIntegration;
  onDelete: (integration: AiAssistantIntegration) => void;
  onEdit: (integration: AiAssistantIntegration) => void;
}) {
  return (
    <tr>
      <td style={textTdStyle}>{integration.title}</td>
      <td style={compactTdStyle}>{aiAssistantConnectorStatusLabels[integration.status]}</td>
      <td style={compactTdStyle}>{formatMode(integration.mode)}</td>
      <td style={textTdStyle}>{integration.description}</td>
      <td style={textTdStyle}>{integration.availableCapabilities?.join(", ") || "Не задано"}</td>
      <td style={textTdStyle}>{integration.stubNotes || "Dry-run"}</td>
      <td style={textTdStyle}>{integration.nextStep || "Определить подключение"}</td>
      <td style={textTdStyle}>{integration.requiredScopes.join(", ")}</td>
      <td style={compactCenterTdStyle}>
        <span style={rowActionsStyle}>
          <IconButton label="Редактировать интеграцию" onClick={() => onEdit(integration)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton label="Удалить интеграцию" onClick={() => onDelete(integration)} tone="danger">
            <Trash2 size={15} />
          </IconButton>
        </span>
      </td>
    </tr>
  );
}
