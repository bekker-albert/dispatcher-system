import type { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { PtoBucketRowLookupSource } from "@/features/pto/ptoDateLookupModel";

export function createEmptyPtoDateModel(ptoPlanYear: string): ReturnType<typeof useAppPtoDateModel> {
  return {
    isPtoSection: true,
    isPtoDateTab: false,
    isPtoBucketsSection: false,
    activePtoDateRows: [] as PtoPlanRow[],
    ptoBucketRowLookupSources: [] as PtoBucketRowLookupSource[],
    ptoYearTabs: [ptoPlanYear],
    ptoYearMonths: [],
    ptoMonthGroups: [],
    ptoAreaTabs: [],
    ptoDateOptionMaps: {
      allAreasKey: "__all__",
      locationsByArea: new Map<string, string[]>(),
      structuresByArea: new Map<string, string[]>(),
      structuresByAreaLocation: new Map<string, string[]>(),
    },
  };
}
