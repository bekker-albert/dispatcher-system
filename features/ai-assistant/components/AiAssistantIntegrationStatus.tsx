import type { AiAssistantIntegration } from "@/features/ai-assistant/types";
import { aiAssistantConnectorStatusLabels } from "@/lib/domain/ai-assistant/status";
import {
  aiAssistantListItemStyle,
  aiAssistantListStyle,
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantIntegrationStatus({
  integrations,
}: {
  integrations: AiAssistantIntegration[];
}) {
  return (
    <section style={aiAssistantPanelStyle}>
      <div style={aiAssistantListStyle}>
        {integrations.map((integration) => (
          <div key={integration.key} style={aiAssistantListItemStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{integration.title}</div>
                <div style={aiAssistantMutedTextStyle}>{integration.description}</div>
              </div>
              <span style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "4px 8px",
                color: "#0f172a",
                background: integration.status === "disabled" ? "#f1f5f9" : "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}>
                {aiAssistantConnectorStatusLabels[integration.status]}
              </span>
            </div>
            <div style={{ ...aiAssistantMutedTextStyle, marginTop: 6 }}>
              Режим: {formatMode(integration.mode)}. Права: {integration.requiredScopes.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatMode(mode: AiAssistantIntegration["mode"]) {
  const labels: Record<AiAssistantIntegration["mode"], string> = {
    read: "чтение",
    write: "запись через согласование",
    "read-write": "чтение и запись через согласование",
  };

  return labels[mode];
}
