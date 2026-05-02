"use client";

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
  return usePtoDateViewModel(options);
}
