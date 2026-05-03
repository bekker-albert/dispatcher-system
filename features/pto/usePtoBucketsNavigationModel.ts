import { useMemo } from "react";

import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import { cleanAreaName, uniqueSorted } from "@/lib/utils/text";
import {
  createPtoAreaAndBucketRowLookupSourceBundle,
  createPtoBucketAreaLookupSourceBundle,
  ptoAreaAndBucketRowGroupsSignature,
  type PtoAreaLookupSource,
  type PtoBucketRowLookupSource,
} from "./ptoDateLookupModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

const allAreasLabel = "Все участки";

const emptyAreaLookupBundle = { sources: [] as PtoAreaLookupSource[], signature: "" };
const emptyAreaAndBucketRowLookupBundle = {
  areaSources: [] as PtoAreaLookupSource[],
  areaSignature: "",
  bucketRowSources: [] as PtoBucketRowLookupSource[],
  bucketRowSignature: "",
};

function useStablePtoAreaLookupSources(bundle: { sources: PtoAreaLookupSource[]; signature: string }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bundle.sources, [bundle.signature]);
}

function useStablePtoBucketRowLookupSources(bundle: { sources: PtoBucketRowLookupSource[]; signature: string }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bundle.sources, [bundle.signature]);
}

type UsePtoBucketsNavigationModelOptions = {
  renderedTopTab: string;
  ptoTab: string;
  deferredPtoPlanRows: PtoPlanRow[];
  deferredPtoOperRows: PtoPlanRow[];
  deferredPtoSurveyRows: PtoPlanRow[];
  ptoBucketManualRows: PtoBucketRow[];
};

export function usePtoBucketsNavigationModel({
  renderedTopTab,
  ptoTab,
  deferredPtoPlanRows,
  deferredPtoOperRows,
  deferredPtoSurveyRows,
  ptoBucketManualRows,
}: UsePtoBucketsNavigationModelOptions) {
  const isPtoBucketsSection = renderedTopTab === "pto" && ptoTab === "buckets";

  const referenceLookupSignature = useMemo(() => (
    isPtoBucketsSection
      ? ptoAreaAndBucketRowGroupsSignature([deferredPtoPlanRows, deferredPtoSurveyRows, deferredPtoOperRows])
      : ""
  ), [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, isPtoBucketsSection]);

  const referenceLookupBundle = useMemo(() => (
    isPtoBucketsSection
      ? createPtoAreaAndBucketRowLookupSourceBundle([deferredPtoPlanRows, deferredPtoSurveyRows, deferredPtoOperRows])
      : emptyAreaAndBucketRowLookupBundle
  // The bundle only depends on area/structure. Numeric PTO edits change row identity but must not rebuild bucket rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [isPtoBucketsSection, referenceLookupSignature]);

  const bucketAreaLookupSources = useStablePtoAreaLookupSources(
    useMemo(() => ({
      sources: referenceLookupBundle.areaSources,
      signature: referenceLookupBundle.areaSignature,
    }), [referenceLookupBundle]),
  );
  const ptoBucketRowLookupSources = useStablePtoBucketRowLookupSources(
    useMemo(() => ({
      sources: referenceLookupBundle.bucketRowSources,
      signature: referenceLookupBundle.bucketRowSignature,
    }), [referenceLookupBundle]),
  );
  const manualAreaLookupSources = useStablePtoAreaLookupSources(
    useMemo(() => (
      isPtoBucketsSection ? createPtoBucketAreaLookupSourceBundle(ptoBucketManualRows) : emptyAreaLookupBundle
    ), [isPtoBucketsSection, ptoBucketManualRows]),
  );

  const ptoAreaTabs = useMemo(() => (
    isPtoBucketsSection
      ? [
          allAreasLabel,
          ...uniqueSorted([
            ...bucketAreaLookupSources.map((source) => cleanAreaName(source.area)),
            ...manualAreaLookupSources.map((source) => cleanAreaName(source.area)),
          ]),
        ]
      : [allAreasLabel]
  ), [bucketAreaLookupSources, isPtoBucketsSection, manualAreaLookupSources]);

  return {
    isPtoBucketsSection,
    ptoBucketRowLookupSources,
    ptoBucketAreaTabs: ptoAreaTabs,
  };
}
