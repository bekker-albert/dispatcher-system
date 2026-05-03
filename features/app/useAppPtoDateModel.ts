"use client";

import { usePtoBucketsNavigationModel } from "@/features/pto/usePtoBucketsNavigationModel";
import { usePtoDateViewModel } from "@/features/pto/usePtoDateViewModel";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

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
  const bucketModel = usePtoBucketsNavigationModel(options);

  return {
    ...dateModel,
    isPtoBucketsSection: bucketModel.isPtoBucketsSection,
    ptoBucketRowLookupSources: bucketModel.ptoBucketRowLookupSources,
    ptoAreaTabs: bucketModel.isPtoBucketsSection ? bucketModel.ptoBucketAreaTabs : dateModel.ptoAreaTabs,
  };
}
