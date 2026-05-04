export type AiAssistantCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  participants: string[];
  status: "draft" | "needs-approval" | "approved" | "created" | "cancelled";
  linkedTaskId?: string;
  updatedAt: string;
};
