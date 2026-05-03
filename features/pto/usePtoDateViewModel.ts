import { useMemo } from "react";

import { formatMonthName } from "@/lib/domain/pto/formatting";
import {
  isPtoDateTableKey,
  monthDays,
  ptoYearOptionsFromSources,
  yearMonths,
  type PtoPlanRow,
} from "@/lib/domain/pto/date-table";
import { cleanAreaName, normalizeLookupValue, uniqueSorted } from "@/lib/utils/text";
import {
  createPtoAreaLookupSourceBundle,
  createPtoDateLookupSourceBundle,
  type PtoAreaLookupSource,
  type PtoDateLookupSource,
} from "./ptoDateLookupModel";

const emptyDateLookupBundle = { sources: [] as PtoDateLookupSource[], signature: "" };
const emptyAreaLookupBundle = { sources: [] as PtoAreaLookupSource[], signature: "" };

const allAreasLabel = "Все участки";

function useStablePtoDateLookupSources(bundle: { sources: PtoDateLookupSource[]; signature: string }) {
  // The signature intentionally excludes numeric cell values, so lookup maps
  // do not rebuild on every plan/fact/survey cell edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bundle.sources, [bundle.signature]);
}

function useStablePtoAreaLookupSources(bundle: { sources: PtoAreaLookupSource[]; signature: string }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => bundle.sources, [bundle.signature]);
}

type UsePtoDateViewModelOptions = {
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

export function usePtoDateViewModel({
  renderedTopTab,
  ptoTab,
  ptoDateEditing,
  ptoPlanYear,
  ptoManualYears,
  expandedPtoMonths,
  ptoPlanRows,
  ptoOperRows,
  ptoSurveyRows,
  deferredPtoPlanRows,
  deferredPtoOperRows,
  deferredPtoSurveyRows,
}: UsePtoDateViewModelOptions) {
  const isPtoSection = renderedTopTab === "pto";
  const isPtoDateTab = isPtoSection && isPtoDateTableKey(ptoTab);

  const activePtoDateRows = useMemo(() => {
    if (!isPtoSection) return [];
    if (ptoTab === "plan") return ptoPlanRows;
    if (ptoTab === "oper") return ptoOperRows;
    if (ptoTab === "survey") return ptoSurveyRows;
    return [];
  }, [isPtoSection, ptoOperRows, ptoPlanRows, ptoSurveyRows, ptoTab]);

  const activePtoDateLookupRows = useMemo(() => {
    if (!isPtoSection) return [];
    if (ptoTab === "plan") return deferredPtoPlanRows;
    if (ptoTab === "oper") return deferredPtoOperRows;
    if (ptoTab === "survey") return deferredPtoSurveyRows;
    return [];
  }, [deferredPtoOperRows, deferredPtoPlanRows, deferredPtoSurveyRows, isPtoSection, ptoTab]);

  const activePtoDateLookupBundle = useMemo(() => (
    isPtoDateTab ? createPtoDateLookupSourceBundle(activePtoDateLookupRows) : emptyDateLookupBundle
  ), [activePtoDateLookupRows, isPtoDateTab]);
  const activePtoDateLookupSources = useStablePtoDateLookupSources(activePtoDateLookupBundle);
  const activePtoAreaLookupBundle = useMemo(() => (
    isPtoDateTab ? createPtoAreaLookupSourceBundle(activePtoDateLookupRows) : emptyAreaLookupBundle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [activePtoDateLookupBundle.signature, isPtoDateTab]);
  const allPtoAreaLookupSources = useStablePtoAreaLookupSources(activePtoAreaLookupBundle);

  const ptoYearTabs = useMemo(() => (
    isPtoDateTab ? ptoYearOptionsFromSources(activePtoDateLookupSources, ptoPlanYear, ptoManualYears) : [ptoPlanYear]
  ), [activePtoDateLookupSources, isPtoDateTab, ptoManualYears, ptoPlanYear]);

  const ptoYearMonths = useMemo(() => (
    isPtoDateTab ? yearMonths(ptoPlanYear) : []
  ), [isPtoDateTab, ptoPlanYear]);

  const ptoMonthGroups = useMemo(() => (
    isPtoDateTab ? ptoYearMonths.map((month) => ({
      month,
      label: formatMonthName(month),
      days: monthDays(month),
      expanded: expandedPtoMonths[month] === true,
    })) : []
  ), [expandedPtoMonths, isPtoDateTab, ptoYearMonths]);

  const ptoAreaTabs = useMemo(() => (
    isPtoDateTab
      ? [
          allAreasLabel,
          ...uniqueSorted(allPtoAreaLookupSources.map((source) => cleanAreaName(source.area))),
        ]
      : [allAreasLabel]
  ), [allPtoAreaLookupSources, isPtoDateTab]);

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

    if (!isPtoDateTab || !ptoDateEditing) {
      return {
        allAreasKey,
        locationsByArea: new Map<string, string[]>(),
        structuresByArea: new Map<string, string[]>(),
        structuresByAreaLocation: new Map<string, string[]>(),
      };
    }

    activePtoDateLookupSources.forEach((source) => {
      const area = cleanAreaName(source.area).trim();
      const areaKey = normalizeLookupValue(area);
      const location = source.location.trim();
      const structure = source.structure.trim();
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
  }, [activePtoDateLookupSources, isPtoDateTab, ptoDateEditing]);

  return {
    isPtoSection,
    isPtoDateTab,
    activePtoDateRows,
    ptoYearTabs,
    ptoYearMonths,
    ptoMonthGroups,
    ptoAreaTabs,
    ptoDateOptionMaps,
  };
}
