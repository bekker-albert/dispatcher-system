import type { AiAssistantPlannerItem } from "@/features/ai-assistant/types";

export type PlannerCalendarDay = {
  date: string;
  dayOfMonth: number;
  taskCount: number;
  isCurrentMonth: boolean;
  isCurrentWorkDate: boolean;
};

export function getPlannerMonthKey(date: string) {
  const [year, month] = date.split("-");
  return `${year}-${month}`;
}

export function formatPlannerMonthTitle(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function shiftPlannerMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function createPlannerCalendarDays({
  currentWorkDate,
  items,
  monthKey,
}: {
  currentWorkDate: string;
  items: AiAssistantPlannerItem[];
  monthKey: string;
}): PlannerCalendarDay[] {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  const taskCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.plannedDate] = (counts[item.plannedDate] ?? 0) + 1;
    return counts;
  }, {});

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const value = formatPlannerDateValue(date);

    return {
      date: value,
      dayOfMonth: date.getDate(),
      taskCount: taskCounts[value] ?? 0,
      isCurrentMonth: date.getFullYear() === year && date.getMonth() === month - 1,
      isCurrentWorkDate: value === currentWorkDate,
    };
  });
}

function formatPlannerDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
