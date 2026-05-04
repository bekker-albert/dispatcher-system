import type { AiAssistantCalendarEvent } from "@/features/ai-assistant/types";

export const aiAssistantCalendarEventsMock: AiAssistantCalendarEvent[] = [
    {
      id: "calendar-trip-balkhash",
      title: "Командировка на Балхаш",
      startsAt: "2026-04-25T08:00:00.000Z",
      endsAt: "2026-04-25T18:00:00.000Z",
      participants: ["Начальник диспетчерской службы"],
      status: "needs-approval",
      linkedTaskId: "ai-task-004",
      updatedAt: "2026-04-24T09:35:00.000Z",
    },
  ];
