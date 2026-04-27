export function dateRange(start: string, end: string) {
  const result: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const final = new Date(`${end}T00:00:00`);

  while (current <= final) {
    result.push(formatLocalDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return formatLocalDateKey(date);
}

function formatLocalDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function distributeTotal(target: Record<string, number>, days: string[], total: number) {
  if (!days.length || !total) return;
  const dailyValue = total / days.length;
  days.forEach((day) => {
    target[day] = Number(dailyValue.toFixed(6));
  });
}

export function distributeMonthlyTotal(total: number, days: string[]) {
  if (!Number.isFinite(total) || days.length === 0) return {};

  const totalThousands = Math.round(total * 1000);
  const sign = totalThousands < 0 ? -1 : 1;
  const absoluteThousands = Math.abs(totalThousands);
  const baseThousands = Math.floor(absoluteThousands / days.length);
  const remainderThousands = absoluteThousands % days.length;

  return days.reduce<Record<string, number>>((values, day, index) => {
    values[day] = (sign * (baseThousands + (index < remainderThousands ? 1 : 0))) / 1000;
    return values;
  }, {});
}

export function monthDays(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  const daysCount = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: daysCount }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

export function yearMonths(year: string) {
  return Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}
