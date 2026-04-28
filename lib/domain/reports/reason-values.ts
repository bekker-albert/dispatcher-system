import { reportReasonOverrideIsCoveredByAutomatic } from "./reason-aggregation";
import { reportYearReasonFromIndex, reportYearReasonFromMap, type ReportReasonIndex } from "./reason-index";
import { reportReasonEmptyOverride, reportYearReasonOverrideKey } from "./reason-keys";

export function reportYearReasonValue(
  reasons: Record<string, string>,
  rowKey: string,
  reportDateValue: string,
  fallback: string,
  startDate: string,
) {
  const manualValue = reasons[reportYearReasonOverrideKey(reportDateValue, rowKey)];
  const automaticValue = reportYearReasonFromMap(reasons, rowKey, reportDateValue, startDate) || fallback;

  if (manualValue === reportReasonEmptyOverride) return "";

  if (manualValue !== undefined && manualValue !== reportReasonEmptyOverride) {
    return reportReasonOverrideIsCoveredByAutomatic(manualValue, automaticValue) ? automaticValue : manualValue;
  }

  return automaticValue;
}

export function reportYearReasonValueFromIndex(
  reasons: Record<string, string>,
  reasonIndex: ReportReasonIndex,
  rowKey: string,
  reportDateValue: string,
  fallback: string,
  startDate: string,
) {
  const manualValue = reasons[reportYearReasonOverrideKey(reportDateValue, rowKey)];
  const automaticValue = reportYearReasonFromIndex(reasonIndex, rowKey, reportDateValue, startDate) || fallback;

  if (manualValue === reportReasonEmptyOverride) return "";

  if (manualValue !== undefined && manualValue !== reportReasonEmptyOverride) {
    return reportReasonOverrideIsCoveredByAutomatic(manualValue, automaticValue) ? automaticValue : manualValue;
  }

  return automaticValue;
}

export function reportYearReasonTextWithManualOverride(
  reasons: Record<string, string>,
  rowKey: string,
  reportDateValue: string,
  automaticValue: string,
) {
  const manualValue = reasons[reportYearReasonOverrideKey(reportDateValue, rowKey)];

  if (manualValue === reportReasonEmptyOverride) return "";

  if (manualValue !== undefined && manualValue !== reportReasonEmptyOverride) {
    return reportReasonOverrideIsCoveredByAutomatic(manualValue, automaticValue) ? automaticValue : manualValue;
  }

  return automaticValue;
}
