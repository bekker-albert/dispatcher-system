const reportReasonHoursPattern = /\([^()\n]*?([-+]?\d+(?:[.,]\d+)?)\s*ч\.?[^()\n]*\)?/i;
const reportReasonEquipmentCountPattern = /^\s*\d+(?:[.,]\d+)?\s*(?:ед\.?|шт\.?)\s*/i;
const reportReasonLeadingLowercasePattern = /^[а-яёa-z]/;
const reportReasonAliases: Array<[RegExp, string]> = [
  [/^неблагоприятные погодные условия:?$/i, "Погодные условия"],
  [/^неблагоприятные погодные условия\b.*$/i, "Погодные условия"],
];
const reportReasonHoursFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

function normalizeReportReasonPart(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeReportReasonLabel(value: string) {
  const normalized = normalizeReportReasonPart(value).replace(/:$/, "");
  const alias = reportReasonAliases.find(([pattern]) => pattern.test(normalized));
  return alias ? alias[1] : normalized;
}

function normalizeReportReasonKey(value: string) {
  return normalizeReportReasonLabel(value).toLowerCase();
}

function formatReportReasonHours(value: number) {
  return reportReasonHoursFormatter.format(Math.round(value * 100) / 100);
}

function formatReportReasonHoursText(value: number) {
  return `(${formatReportReasonHours(value)}\u00a0ч.)`;
}

function reportReasonTextWithoutHours(value: string, hoursMatch: RegExpMatchArray | null) {
  return hoursMatch
    ? normalizeReportReasonPart(value.replace(reportReasonHoursPattern, "").replace(reportReasonEquipmentCountPattern, "")).replace(/[;,.]$/, "")
    : value;
}

function reportReasonLineLooksLikeHeadingDetail(rawText: string, textWithoutHours: string) {
  return !textWithoutHours
    || reportReasonEquipmentCountPattern.test(rawText)
    || reportReasonLeadingLowercasePattern.test(textWithoutHours);
}

function reportReasonLabelSet(value: string) {
  return new Set(
    value
      .split(/\r?\n/)
      .map((line) => {
        const hoursMatch = line.match(reportReasonHoursPattern);
        return normalizeReportReasonKey(reportReasonTextWithoutHours(normalizeReportReasonPart(line), hoursMatch));
      })
      .filter(Boolean),
  );
}

export function reportReasonOverrideIsCoveredByAutomatic(manualValue: string, automaticValue: string) {
  const manualLabels = reportReasonLabelSet(manualValue);
  const automaticLabels = reportReasonLabelSet(automaticValue);

  return manualLabels.size > 0
    && automaticLabels.size >= manualLabels.size
    && Array.from(manualLabels).every((label) => automaticLabels.has(label));
}

export function aggregateReportReasons(values: string[]) {
  const entries = new Map<string, { heading: string; text: string; hours?: number; order: number }>();
  let order = 0;

  values.forEach((value) => {
    let heading = "";
    const lines = value.split(/\r?\n/).map(normalizeReportReasonPart).filter(Boolean);

    lines.forEach((rawText, index) => {
      const hoursMatch = rawText.match(reportReasonHoursPattern);
      const nextText = lines[index + 1] ?? "";
      const nextHoursMatch = nextText.match(reportReasonHoursPattern);
      const nextTextWithoutHours = nextHoursMatch
        ? reportReasonTextWithoutHours(nextText, nextHoursMatch)
        : nextText;
      const nextLineIsHoursOnly = Boolean(nextHoursMatch && !nextTextWithoutHours);

      if (!hoursMatch && (rawText.endsWith(":") || nextLineIsHoursOnly)) {
        heading = normalizeReportReasonLabel(rawText);
        return;
      }

      const hours = hoursMatch ? Number(hoursMatch[1].replace(",", ".")) : null;
      const textWithoutHours = reportReasonTextWithoutHours(rawText, hoursMatch);
      const text = normalizeReportReasonLabel(textWithoutHours);
      if (!text && !heading) return;

      const groupedByHeadingOnly = Boolean(heading && hoursMatch && reportReasonLineLooksLikeHeadingDetail(rawText, textWithoutHours));
      const key = groupedByHeadingOnly
        ? `hours-heading||${normalizeReportReasonKey(heading)}`
        : `${hoursMatch ? "hours" : "text"}||${normalizeReportReasonKey(heading)}||${normalizeReportReasonKey(text)}`;
      const current = entries.get(key);
      if (current) {
        if (hours !== null && Number.isFinite(hours)) current.hours = (current.hours ?? 0) + hours;
        return;
      }

      entries.set(key, {
        heading,
        text: groupedByHeadingOnly ? "" : text,
        hours: hours !== null && Number.isFinite(hours) ? hours : undefined,
        order: order++,
      });

      if (!groupedByHeadingOnly) heading = "";
    });
  });

  const grouped = new Map<string, { heading: string; lines: string[]; order: number }>();
  const plain: Array<{ text: string; order: number }> = [];

  Array.from(entries.values()).sort((left, right) => left.order - right.order).forEach((entry) => {
    const rendered = entry.hours === undefined
      ? entry.text
      : entry.text
        ? `${entry.text}\u00a0${formatReportReasonHoursText(entry.hours)}`
        : formatReportReasonHoursText(entry.hours);

    if (!entry.heading) {
      plain.push({ text: rendered, order: entry.order });
      return;
    }

    const headingKey = normalizeReportReasonKey(entry.heading);
    const group = grouped.get(headingKey);
    if (group) {
      group.lines.push(rendered);
      group.order = Math.min(group.order, entry.order);
    } else {
      grouped.set(headingKey, { heading: entry.heading, lines: [rendered], order: entry.order });
    }
  });

  return [
    ...plain,
    ...Array.from(grouped.values()).map((group) => ({
      text: group.lines.length === 1 && /^\([^)]+\)$/.test(group.lines[0])
        ? `${group.heading}\u00a0${group.lines[0]}`
        : `${group.heading}\n${group.lines.join("\n")}`,
      order: group.order,
    })),
  ]
    .sort((left, right) => left.order - right.order)
    .map((entry) => entry.text)
    .join("\n");
}
