"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import type { TopTab } from "@/lib/domain/navigation/tabs";
import {
  automaticReportDate,
  hasClientReportDateOverride,
  isStoredReportDateValue,
  readClientReportDateSelection,
  reportDateOverrideStorageKey,
  resolveReportDateAreaContext,
} from "@/features/reports/lib/reportDateSelection";

type ReportDateSelectionStateOptions = {
  topTab: TopTab;
  adminSection: AdminSection;
  reportArea: string;
  ptoAreaFilter: string;
  areaShiftCutoffs: AreaShiftCutoffMap;
};

export function useReportDateSelectionState({
  topTab,
  adminSection,
  reportArea,
  ptoAreaFilter,
  areaShiftCutoffs,
}: ReportDateSelectionStateOptions) {
  const [reportDate, setReportDate] = useState(() => (
    readClientReportDateSelection(defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea)
  ));
  const [hasManualReportDateOverride, setHasManualReportDateOverride] = useState(() => hasClientReportDateOverride());

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
      const nextReportDate = readClientReportDateSelection(areaShiftCutoffs, nextReportDateAreaContext);

      setHasManualReportDateOverride(hasClientReportDateOverride());
      setReportDate((current) => (current === nextReportDate ? current : nextReportDate));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [adminSection, areaShiftCutoffs, ptoAreaFilter, reportArea, topTab]);

  useEffect(() => {
    if (hasManualReportDateOverride) return undefined;

    const syncAutomaticReportDate = () => {
      const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
      const nextReportDate = automaticReportDate(areaShiftCutoffs, nextReportDateAreaContext);
      setReportDate((current) => (current === nextReportDate ? current : nextReportDate));
    };

    const timeoutId = window.setTimeout(syncAutomaticReportDate, 0);
    const intervalId = window.setInterval(syncAutomaticReportDate, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [adminSection, areaShiftCutoffs, hasManualReportDateOverride, ptoAreaFilter, reportArea, topTab]);

  const selectReportDate = useCallback((value: string) => {
    if (!isStoredReportDateValue(value)) return;

    setReportDate(value);
    setHasManualReportDateOverride(true);
    window.localStorage.setItem(reportDateOverrideStorageKey, value);
  }, []);

  return {
    reportDate,
    selectReportDate,
  };
}
