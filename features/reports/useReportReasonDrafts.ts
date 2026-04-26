import { useRef, type Dispatch, type SetStateAction } from "react";

import { reportReasonEntryKey, reportYearReasonOverrideKey } from "@/lib/domain/reports/reasons";

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
  const draftTimerRef = useRef<number | null>(null);

  function clearDraftTimer() {
    if (draftTimerRef.current !== null) {
      window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }

  function upsertReason(key: string, value: string, normalize = false) {
    const nextValue = normalize ? value.trim() : value;

    setReportReasons((current) => {
      const next = { ...current };
      if (nextValue !== "") {
        next[key] = nextValue;
      } else {
        delete next[key];
      }

      return next;
    });
  }

  function commitReportDayReason(rowKey: string, value: string) {
    clearDraftTimer();
    upsertReason(reportReasonEntryKey(reportDate, rowKey), value);
    window.setTimeout(requestSave, 0);
  }

  function commitReportYearReason(rowKey: string, value: string) {
    clearDraftTimer();
    upsertReason(reportYearReasonOverrideKey(reportDate, rowKey), value, true);
    window.setTimeout(requestSave, 0);
  }

  function updateReportDayReasonDraft(rowKey: string, value: string) {
    clearDraftTimer();

    draftTimerRef.current = window.setTimeout(() => {
      upsertReason(reportReasonEntryKey(reportDate, rowKey), value);
      draftTimerRef.current = null;
    }, 180);
  }

  function updateReportYearReasonDraft(rowKey: string, value: string) {
    clearDraftTimer();

    draftTimerRef.current = window.setTimeout(() => {
      upsertReason(reportYearReasonOverrideKey(reportDate, rowKey), value, true);
      draftTimerRef.current = null;
    }, 180);
  }

  function cancelReportDayReasonDraft(rowKey: string, value: string) {
    clearDraftTimer();
    upsertReason(reportReasonEntryKey(reportDate, rowKey), value);
  }

  function cancelReportYearReasonDraft(rowKey: string, value: string) {
    clearDraftTimer();
    upsertReason(reportYearReasonOverrideKey(reportDate, rowKey), value, true);
  }

  return {
    commitReportDayReason,
    cancelReportDayReasonDraft,
    updateReportDayReasonDraft,
    commitReportYearReason,
    cancelReportYearReasonDraft,
    updateReportYearReasonDraft,
  };
}
