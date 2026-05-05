import type { AiAssistantTab } from "@/features/ai-assistant/types";
import { aiAssistantTabsStyle } from "@/features/ai-assistant/aiAssistantStyles";

const aiAssistantTabs: { id: AiAssistantTab; label: string }[] = [
  { id: "tasks", label: "Задачи" },
  { id: "planner", label: "Планировщик" },
  { id: "agents", label: "Агенты" },
  { id: "development", label: "Развитие / ТЗ / Codex" },
  { id: "integrations", label: "Интеграции" },
  { id: "knowledge", label: "Знания" },
  { id: "audit", label: "Журнал" },
];

export function AiAssistantTabs({
  activeTab,
  onSelectTab,
}: {
  activeTab: AiAssistantTab;
  onSelectTab: (tab: AiAssistantTab) => void;
}) {
  return (
    <div style={aiAssistantTabsStyle}>
      {aiAssistantTabs.map((tab) => {
        const active = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            style={{
              border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
              background: active ? "#0f172a" : "#ffffff",
              color: active ? "#ffffff" : "#0f172a",
              borderRadius: 8,
              padding: "8px 12px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
