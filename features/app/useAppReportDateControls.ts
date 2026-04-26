"use client";

import type { Dispatch, SetStateAction } from "react";

import { useAreaShiftCutoffEditor } from "@/features/reports/useAreaShiftCutoffEditor";
import { useReportDateSelectionState } from "@/features/reports/useReportDateSelectionState";
import type { AreaShiftCutoffMap } from "@/lib/domain/admin/area-schedule";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import type { TopTab } from "@/lib/domain/navigation/tabs";

type UseAppReportDateControlsOptions = {
  topTab: TopTab;
  adminSection: AdminSection;
  reportArea: string;
  ptoAreaFilter: string;
  areaShiftCutoffs: AreaShiftCutoffMap;
  setAreaShiftCutoffs: Dispatch<SetStateAction<AreaShiftCutoffMap>>;
};

export function useAppReportDateControls({
  topTab,
  adminSection,
  reportArea,
  ptoAreaFilter,
  areaShiftCutoffs,
  setAreaShiftCutoffs,
}: UseAppReportDateControlsOptions) {
  const {
    reportDate,
    selectReportDate,
  } = useReportDateSelectionState({
    topTab,
    adminSection,
    reportArea,
    ptoAreaFilter,
    areaShiftCutoffs,
  });

  const { updateAreaShiftCutoff } = useAreaShiftCutoffEditor({ setAreaShiftCutoffs });

  return {
    reportDate,
    selectReportDate,
    updateAreaShiftCutoff,
  };
}
