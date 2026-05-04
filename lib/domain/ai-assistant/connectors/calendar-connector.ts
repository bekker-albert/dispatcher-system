import { createDryRunAiAssistantConnector } from "./common";

// Реальный календарь подключается через backend/API, чтобы ключи и refresh-токены не попадали в браузер.
export const calendarDomainConnector = createDryRunAiAssistantConnector({
  key: "calendar",
  title: "Календарь",
  capabilities: ["read", "draft", "approve", "send", "sync"],
  requiredScopes: ["ai.calendar.read", "ai.calendar.write"],
  draftPrefix: "calendar",
  syncErrorCode: "CALENDAR_DRY_RUN_REQUIRED",
  executeErrorCode: "CALENDAR_APPROVAL_REQUIRED",
});
