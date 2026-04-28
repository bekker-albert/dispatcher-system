const reportIntegerFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const reportFullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});
const reportWeekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long" });
const reportCalendarDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function statusColor(value: number) {
  if (value >= 80) return "#dcfce7";
  if (value >= 50) return "#fef3c7";
  return "#fee2e2";
}

export function statusTextColor(value: number) {
  if (value >= 80) return "#166534";
  if (value >= 50) return "#92400e";
  return "#991b1b";
}

export function delta(plan: number, fact: number) {
  return fact - plan;
}

export function formatNumber(value: number) {
  return reportIntegerFormatter.format(value);
}

export function formatPercent(fact: number, plan: number) {
  if (!plan) return fact ? "100%" : "0%";

  return `${Math.round((fact / plan) * 100)}%`;
}

export function formatReportDate(value: string) {
  return reportFullDateFormatter.format(new Date(`${value}T00:00:00`));
}

export function formatReportTitleDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const weekday = reportWeekdayFormatter.format(date);
  const weekdayAccusative: Record<string, string> = {
    понедельник: "понедельник",
    вторник: "вторник",
    среда: "среду",
    четверг: "четверг",
    пятница: "пятницу",
    суббота: "субботу",
    воскресенье: "воскресенье",
  };
  const calendarDate = reportCalendarDateFormatter.format(date);

  return `${weekdayAccusative[weekday] ?? weekday}, ${calendarDate}`;
}

const reportNoBreakAfterWords = new Set(["в", "во", "на", "с", "со", "к", "ко", "по", "из", "от", "до", "за", "под", "над", "для", "при", "у", "о", "об"]);

export function formatReportWorkName(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  return words.reduce((text, word, index) => {
    if (index === 0) return word;

    const previousWord = words[index - 1].replace(/[.,;:!?()[\]{}"]/g, "").toLowerCase();
    const separator = reportNoBreakAfterWords.has(previousWord) ? "\u00a0" : " ";

    return `${text}${separator}${word}`;
  }, "");
}
