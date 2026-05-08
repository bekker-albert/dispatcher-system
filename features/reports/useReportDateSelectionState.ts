"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultAreaShiftCutoffs, defaultAreaShiftScheduleArea, type AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import type { TopTab } from "@/lib/domain/navigation/tabs";
import {
  isStoredReportDateValue,
  readClientReportDateSelection,
  resolveReportDateAreaContext,
  writeClientReportDateOverride,
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

  useEffect(() => {
    const syncReportDate = () => {
      const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
      const nextReportDate = readClientReportDateSelection(areaShiftCutoffs, nextReportDateAreaContext);

      setReportDate((current) => (current === nextReportDate ? current : nextReportDate));
    };

    const timeoutId = window.setTimeout(syncReportDate, 0);
    const intervalId = window.setInterval(syncReportDate, 60000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [adminSection, areaShiftCutoffs, ptoAreaFilter, reportArea, topTab]);

  const selectReportDate = useCallback((value: string) => {
    if (!isStoredReportDateValue(value)) return;

    const nextReportDateAreaContext = resolveReportDateAreaContext(topTab, adminSection, reportArea, ptoAreaFilter);
    setReportDate(value);
    writeClientReportDateOverride(value, areaShiftCutoffs, nextReportDateAreaContext);
  }, [adminSection, areaShiftCutoffs, ptoAreaFilter, reportArea, topTab]);

  return {
    reportDate,
    selectReportDate,
  };
}
