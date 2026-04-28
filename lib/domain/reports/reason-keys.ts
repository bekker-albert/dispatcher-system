export const reportReasonEmptyOverride = "__empty__";

const reportReasonEntryKeyPattern = /^\d{4}-\d{2}-\d{2}\|\|/;

export function reportReason(fact: number, plan: number, reason: string) {
  if (fact >= plan) return "";
  return reason.trim();
}

export function reportReasonEntryKey(date: string, rowKey: string) {
  return `${date}||${rowKey}`;
}

export function reportYearReasonOverrideKey(date: string, rowKey: string) {
  return `year:${date}||${rowKey}`;
}

export function reportReasonEntryDate(key: string) {
  return reportReasonEntryKeyPattern.test(key) ? key.slice(0, 10) : "";
}

export function reportReasonEntryRowKey(key: string) {
  return reportReasonEntryKeyPattern.test(key) ? key.slice(12) : "";
}
