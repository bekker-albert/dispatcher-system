import { useMemo } from "react";

import { formatMonthName } from "@/lib/domain/pto/formatting";
import {
  isPtoDateTableKey,
  monthDays,
  ptoYearOptions,
  yearMonths,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import type { PtoBucketRow } from "@/lib/domain/pto/buckets";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";

const allAreasLabel = "Все участки";

type UsePtoDateViewModelOptions = {
  renderedTopTab: string;
  ptoTab: string;
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

export function usePtoDateViewModel({
  renderedTopTab,
  ptoTab,
  ptoPlanYear,
  ptoManualYears,
  expandedPtoMonths,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  deferredPtoPlanRows,
  deferredPtoOperRows,
  deferredPtoSurveyRows,
  ptoBucketManualRows,
}: UsePtoDateViewModelOptions) {
  const isPtoSection = renderedTopTab === "pto";
  const isPtoDateTab = isPtoSection && isPtoDateTableKey(ptoTab);
  const isPtoBucketsSection = renderedTopTab === "pto" && ptoTab === "buckets";

  const activePtoDateRows = useMemo(() => {
    if (!isPtoSection) return [];
    if (ptoTab === "plan") return ptoPlanRows;
    if (ptoTab === "oper") return ptoOperRows;
    if (ptoTab === "survey") return ptoSurveyRows;
    return [];
  }, [isPtoSection, ptoOperRows, ptoPlanRows, ptoSurveyRows, ptoTab]);

  const allPtoDateRows = useMemo(() => (
    isPtoBucketsSection
      ? [...deferredPtoPlanRows, ...deferredPtoSurveyRows, ...deferredPtoOperRows]
      : activePtoDateRows
  ), [activePtoDateRows, deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, isPtoBucketsSection]);

  const ptoYearTabs = useMemo(() => (
    isPtoDateTab ? ptoYearOptions(activePtoDateRows, ptoPlanYear, ptoManualYears) : [ptoPlanYear]
  ), [activePtoDateRows, isPtoDateTab, ptoManualYears, ptoPlanYear]);

  const ptoYearMonths = useMemo(() => yearMonths(ptoPlanYear), [ptoPlanYear]);

  const ptoMonthGroups = useMemo(() => (
    ptoYearMonths.map((month) => ({
      month,
      label: formatMonthName(month),
      days: monthDays(month),
      expanded: expandedPtoMonths[month] === true,
    }))
  ), [expandedPtoMonths, ptoYearMonths]);

  const ptoAreaTabs = useMemo(() => (
    isPtoSection
      ? [
          allAreasLabel,
          ...uniqueSorted([
            ...allPtoDateRows.map((row) => cleanAreaName(row.area)),
            ...(isPtoBucketsSection ? ptoBucketManualRows.map((row) => cleanAreaName(row.area)) : []),
          ]),
        ]
      : [allAreasLabel]
  ), [allPtoDateRows, isPtoBucketsSection, isPtoSection, ptoBucketManualRows]);

  const ptoDateOptionMaps = useMemo(() => {
    const allAreasKey = "__all__";
    const locationsByArea = new Map<string, Set<string>>();
    const structuresByArea = new Map<string, Set<string>>();
    const structuresByAreaLocation = new Map<string, Set<string>>();
    const addValue = (map: Map<string, Set<string>>, key: string, value: string) => {
      const text = value.trim();
      if (!text) return;

      const values = map.get(key) ?? new Set<string>();
      values.add(text);
      map.set(key, values);
    };

    if (!isPtoDateTab) {
      return {
        allAreasKey,
        locationsByArea: new Map<string, string[]>(),
        structuresByArea: new Map<string, string[]>(),
        structuresByAreaLocation: new Map<string, string[]>(),
      };
    }

    activePtoDateRows.forEach((row) => {
      const area = cleanAreaName(row.area).trim();
      const areaKey = normalizeLookupValue(area);
      const location = row.location.trim();
      const structure = row.structure.trim();
      const areaKeys = [allAreasKey, areaKey].filter(Boolean);

      areaKeys.forEach((key) => {
        addValue(locationsByArea, key, location);
        addValue(structuresByArea, key, structure);
        addValue(structuresByAreaLocation, `${key}:${normalizeLookupValue(location)}`, structure);
      });
    });

    const normalizeMap = (map: Map<string, Set<string>>) => new Map(
      Array.from(map.entries()).map(([key, values]) => [key, uniqueSorted(Array.from(values))] as const),
    );

    return {
      allAreasKey,
      locationsByArea: normalizeMap(locationsByArea),
      structuresByArea: normalizeMap(structuresByArea),
      structuresByAreaLocation: normalizeMap(structuresByAreaLocation),
    };
  }, [activePtoDateRows, isPtoDateTab]);

  return {
    isPtoSection,
    isPtoDateTab,
    isPtoBucketsSection,
    activePtoDateRows,
    allPtoDateRows,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
  };
}
