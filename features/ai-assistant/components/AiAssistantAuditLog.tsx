import type { AiAssistantAuditEvent } from "@/features/ai-assistant/types";
import {
  aiAssistantMutedTextStyle,
  aiAssistantPanelStyle,
  aiAssistantTableStyle,
  aiAssistantTableWrapStyle,
  aiAssistantTdStyle,
  aiAssistantThStyle,
} from "@/features/ai-assistant/aiAssistantStyles";

export function AiAssistantAuditLog({
  events,
}: {
  events: AiAssistantAuditEvent[];
}) {
  const hasEvents = events.length > 0;

  return (
    <section style={aiAssistantPanelStyle}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>Журнал действий</div>
      </div>
      {hasEvents ? (
        <div style={aiAssistantTableWrapStyle}>
          <table style={aiAssistantTableStyle}>
            <thead>
              <tr>
                <th style={aiAssistantThStyle}>Время</th>
                <th style={aiAssistantThStyle}>Пользователь</th>
                <th style={aiAssistantThStyle}>Действие</th>
                <th style={aiAssistantThStyle}>Интеграция</th>
                <th style={aiAssistantThStyle}>Объект</th>
                <th style={{ ...aiAssistantThStyle, width: "30%" }}>Итог</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td style={aiAssistantTdStyle}>{formatDateTime(event.timestamp)}</td>
                  <td style={aiAssistantTdStyle}>{event.actor}</td>
                  <td style={aiAssistantTdStyle}>{event.action}</td>
                  <td style={aiAssistantTdStyle}>{event.connector ?? "Система"}</td>
                  <td style={aiAssistantTdStyle}>{event.target}</td>
                  <td style={aiAssistantTdStyle}>
                    <span style={{ fontWeight: 800 }}>{formatStatus(event.status)}</span>
                    <div style={aiAssistantMutedTextStyle}>{event.summary}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={emptyStateStyle}>История действий пока пустая.</div>
      )}
    </section>
  );
}

const emptyStateStyle = {
  ...aiAssistantMutedTextStyle,
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  background: "#f8fafc",
  padding: 16,
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: AiAssistantAuditEvent["status"]) {
  const labels: Record<AiAssistantAuditEvent["status"], string> = {
    success: "Выполнено",
    blocked: "Заблокировано",
    failed: "Ошибка",
  };

  return labels[status];
}
