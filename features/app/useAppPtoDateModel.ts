"use client";

import { usePtoDateViewModel } from "@/features/pto/usePtoDateViewModel";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
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
  ptoBucketManualRows: PtoBucketRow[];
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
