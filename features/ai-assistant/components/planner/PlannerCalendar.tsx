"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PlannerCalendarDay } from "@/features/ai-assistant/components/planner/plannerCalendarModel";
import { formatPlannerMonthTitle } from "@/features/ai-assistant/components/planner/plannerCalendarModel";
import { PlannerIconButton } from "@/features/ai-assistant/components/planner/PlannerIconButton";
import {
  plannerCalendarBadgeStyle,
  plannerCalendarDayMutedStyle,
  plannerCalendarDayNumberStyle,
  plannerCalendarDaySelectedStyle,
  plannerCalendarDayStyle,
  plannerCalendarGridStyle,
  plannerCalendarHeaderStyle,
  plannerCalendarShellStyle,
  plannerCalendarTitleStyle,
  plannerCalendarWeekdayStyle,
  plannerCalendarWeekStyle,
} from "@/features/ai-assistant/components/planner/plannerStyles";

const plannerWeekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function PlannerCalendar({
  currentWorkDate,
  days,
  monthKey,
  selectedDate,
  onChangeMonth,
  onSelectDate,
}: {
  currentWorkDate: string;
  days: PlannerCalendarDay[];
  monthKey: string;
  selectedDate: string;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: string) => void;
}) {
  return (
    <div style={plannerCalendarShellStyle}>
      <div style={plannerCalendarHeaderStyle}>
        <PlannerIconButton label="Предыдущий месяц" onClick={() => onChangeMonth(-1)}>
          <ChevronLeft size={15} />
        </PlannerIconButton>
        <div style={plannerCalendarTitleStyle}>{formatPlannerMonthTitle(monthKey)}</div>
        <PlannerIconButton label="Следующий месяц" onClick={() => onChangeMonth(1)}>
          <ChevronRight size={15} />
        </PlannerIconButton>
      </div>

      <div style={plannerCalendarWeekStyle}>
        {plannerWeekdays.map((weekday) => (
          <div key={weekday} style={plannerCalendarWeekdayStyle}>{weekday}</div>
        ))}
      </div>

      <div style={plannerCalendarGridStyle}>
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const dayStyle = isSelected
            ? plannerCalendarDaySelectedStyle
            : day.isCurrentMonth
              ? plannerCalendarDayStyle
              : plannerCalendarDayMutedStyle;

          return (
            <button
              key={day.date}
              type="button"
              aria-label={`Выбрать ${day.date}`}
              onClick={() => onSelectDate(day.date)}
              style={{
                ...dayStyle,
                borderColor: !isSelected && day.isCurrentWorkDate ? "#16a34a" : dayStyle.borderColor,
              }}
            >
              <span style={plannerCalendarDayNumberStyle}>{day.dayOfMonth}</span>
              {day.taskCount > 0 && (
                <span title={`Задач: ${day.taskCount}`} style={plannerCalendarBadgeStyle}>
                  {day.taskCount}
                </span>
              )}
              {day.date === currentWorkDate && (
                <span style={{ position: "absolute", left: 6, bottom: 6, fontSize: 9, color: "#16a34a" }}>
                  раб.
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
