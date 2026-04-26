import { usePtoDateViewportReset } from "@/features/pto/usePtoDateViewportReset";

type UsePtoDateViewportResetOptions = Parameters<typeof usePtoDateViewportReset>[0];

type UseAppPtoDateViewportOptions = Omit<UsePtoDateViewportResetOptions, "resetKey" | "measureKey"> & {
  expandedPtoMonths: Record<string, boolean>;
  ptoAreaFilter: string;
  ptoPlanYear: string;
  ptoTab: string;
};

function expandedPtoMonthsKey(expandedPtoMonths: Record<string, boolean>) {
  return Object.entries(expandedPtoMonths)
    .filter(([, expanded]) => expanded)
    .map(([month]) => month)
    .sort()
    .join("|");
}

export function useAppPtoDateViewport({
  expandedPtoMonths,
  ptoAreaFilter,
  ptoPlanYear,
  ptoTab,
  ...options
}: UseAppPtoDateViewportOptions) {
  const expandedMonthsKey = expandedPtoMonthsKey(expandedPtoMonths);

  return usePtoDateViewportReset({
    ...options,
    resetKey: `${ptoTab}:${ptoPlanYear}:${ptoAreaFilter}`,
    measureKey: `${ptoTab}:${ptoPlanYear}:${ptoAreaFilter}:${expandedMonthsKey}`,
  });
}
