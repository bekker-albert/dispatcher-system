import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

import { reportReasonEmptyOverride, reportReasonEntryKey, reportYearReasonOverrideKey } from "@/lib/domain/reports/reasons";

type UseReportReasonDraftsOptions = {
  reportDate: string;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  requestSave: () => void;
};

export function useReportReasonDrafts({
  reportDate,
  setReportReasons,
  requestSave,
}: UseReportReasonDraftsOptions) {
  const upsertReason = useCallback((key: string, value: string, normalize = false, emptyValue = "") => {
    const nextValue = normalize ? value.trim() : value;

    setReportReasons((current) => {
      const next = { ...current };
      if (nextValue !== "") {
        next[key] = nextValue;
      } else if (emptyValue) {
        next[key] = emptyValue;
      } else {
        delete next[key];
      }

      return next;
    });
  }, [setReportReasons]);

  const commitReportDayReason = useCallback(function commitReportDayReason(rowKey: string, value: string) {
    upsertReason(reportReasonEntryKey(reportDate, rowKey), value);
    window.setTimeout(requestSave, 0);
  }, [reportDate, requestSave, upsertReason]);

  const commitReportYearReason = useCallback(function commitReportYearReason(rowKey: string, value: string) {
    upsertReason(reportYearReasonOverrideKey(reportDate, rowKey), value, true, reportReasonEmptyOverride);
    window.setTimeout(requestSave, 0);
  }, [reportDate, requestSave, upsertReason]);

  const cancelReportDayReasonDraft = useCallback(function cancelReportDayReasonDraft() {
    // Esc is a local cancel only. Parent state must not be changed.
  }, []);

  const cancelReportYearReasonDraft = useCallback(function cancelReportYearReasonDraft() {
    // Esc is a local cancel only. Parent state must not be changed.
  }, []);

  return {
    commitReportDayReason,
    cancelReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
  };
}
