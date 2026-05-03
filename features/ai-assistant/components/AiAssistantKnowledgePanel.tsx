import type { AiAssistantKnowledgeSource } from "@/features/ai-assistant/types";
import {
  aiAssistantListItemStyle,
  aiAssistantListStyle,
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantKnowledgePanel({
  sources,
}: {
  sources: AiAssistantKnowledgeSource[];
}) {
  return (
    <section style={aiAssistantPanelStyle}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>База знаний</div>
      </div>
      <div style={aiAssistantListStyle}>
        {sources.map((source) => (
          <div key={source.id} style={aiAssistantListItemStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900 }}>{source.title}</div>
                <div style={aiAssistantMutedTextStyle}>
                  Владелец: {source.owner}. Источник: {formatSource(source.source)}.
                </div>
              </div>
              <span style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                padding: "4px 8px",
                height: 24,
                fontSize: 12,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}>
                {formatAccess(source.access)}
              </span>
            </div>
            <div style={{ ...aiAssistantMutedTextStyle, marginTop: 6 }}>
              Метки: {source.tags.join(", ")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatSource(source: AiAssistantKnowledgeSource["source"]) {
  const labels: Record<AiAssistantKnowledgeSource["source"], string> = {
    manual: "ручной ввод",
    file: "файл",
    mail: "почта",
    documentolog: "Documentolog",
    calendar: "календарь",
    system: "система",
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
