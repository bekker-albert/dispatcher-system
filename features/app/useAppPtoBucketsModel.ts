"use client";

import { createEmptyPtoDateModel } from "@/features/app/emptyPtoDateModel";
import { usePtoBucketsNavigationModel } from "@/features/pto/usePtoBucketsNavigationModel";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

type UseAppPtoBucketsModelOptions = {
  renderedTopTab: string;
  ptoTab: string;
  ptoPlanYear: string;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  ptoBucketManualRows: PtoBucketRow[];
};

export function useAppPtoBucketsModel(options: UseAppPtoBucketsModelOptions) {
  const bucketModel = usePtoBucketsNavigationModel(options);

  return {
    ...createEmptyPtoDateModel(options.ptoPlanYear),
    isPtoBucketsSection: bucketModel.isPtoBucketsSection,
    ptoBucketRowLookupSources: bucketModel.ptoBucketRowLookupSources,
    ptoAreaTabs: bucketModel.ptoBucketAreaTabs,
  };
}
