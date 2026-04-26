"use client";

import type { Dispatch, SetStateAction } from "react";

import { useReportReasonDrafts } from "@/features/reports/useReportReasonDrafts";

type UseAppReportReasonEditingOptions = {
  reportDate: string;
  setReportReasons: Dispatch<SetStateAction<Record<string, string>>>;
  requestPtoDatabaseSave: () => void;
};

export function useAppReportReasonEditing({
  reportDate,
  setReportReasons,
  requestPtoDatabaseSave,
}: UseAppReportReasonEditingOptions) {
  return useReportReasonDrafts({
    reportDate,
    setReportReasons,
    requestSave: requestPtoDatabaseSave,
  });
}
