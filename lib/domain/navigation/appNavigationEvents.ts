import type { AiAssistantTab } from "@/lib/domain/ai-assistant/types";
import type { TopTab } from "@/lib/domain/navigation/tabs";

export const appNavigationEventName = "aam:navigate-primary-tab";

export type AppNavigationEventDetail = {
  topTab: TopTab;
  aiAssistantTab?: AiAssistantTab;
};

export function isAppNavigationEvent(event: Event): event is CustomEvent<AppNavigationEventDetail> {
  return event instanceof CustomEvent
    && typeof event.detail === "object"
    && event.detail !== null
    && typeof event.detail.topTab === "string";
}
