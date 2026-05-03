"use client";

import { usePtoDateViewModel } from "@/features/pto/usePtoDateViewModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoBucketRowLookupSource } from "@/features/pto/ptoDateLookupModel";

type UseAppPtoDateModelOptions = {
  renderedTopTab: string;
  ptoTab: string;
  ptoDateEditing: boolean;
  ptoPlanYear: string;
  ptoManualYears: string[];
  expandedPtoMonths: Record<string, boolean>;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
};

export function useAppPtoDateModel(options: UseAppPtoDateModelOptions) {
  const dateModel = usePtoDateViewModel(options);

  return {
    ...dateModel,
    isPtoBucketsSection: false,
    ptoBucketRowLookupSources: [] as PtoBucketRowLookupSource[],
    ptoAreaTabs: dateModel.ptoAreaTabs,
  };
}
