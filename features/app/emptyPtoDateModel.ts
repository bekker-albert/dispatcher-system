import type { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import type { PtoPlanRow } from "@/lib/domain/pto/date-table";

export function createEmptyPtoDateModel(ptoPlanYear: string): ReturnType<typeof useAppPtoDateModel> {
  return {
    isPtoSection: true,
    isPtoDateTab: false,
    isPtoBucketsSection: false,
    activePtoDateRows: [] as PtoPlanRow[],
    allPtoDateRows: [] as PtoPlanRow[],
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
