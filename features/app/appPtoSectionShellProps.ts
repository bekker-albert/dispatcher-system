import type { PtoPlanRow } from "@/lib/domain/pto/date-table";
import type { UseAppPtoScreenPropsArgs } from "@/features/app/appPtoScreenPropsTypes";

export type AppPtoSectionShellProps = {
  ptoTab: string;
  activePtoSubtabLabel: string;
  activePtoSubtabContent: string;
  isPtoDateTab: boolean;
  ptoAreaTabs: string[];
  ptoAreaFilter: string;
  ptoPlanRows: PtoPlanRow[];
  ptoOperRows: PtoPlanRow[];
  ptoSurveyRows: PtoPlanRow[];
  setPtoPlanRows: UseAppPtoScreenPropsArgs["appState"]["setPtoPlanRows"];
  setPtoOperRows: UseAppPtoScreenPropsArgs["appState"]["setPtoOperRows"];
  setPtoSurveyRows: UseAppPtoScreenPropsArgs["appState"]["setPtoSurveyRows"];
  selectPtoArea: (area: string) => void;
  ptoPlanYear: string;
  reportDate: string;
  ptoYearMonths: string[];
  ptoMonthGroups: UseAppPtoScreenPropsArgs["models"]["ptoMonthGroups"];
  ptoYearTabs: string[];
  ptoYearDialogOpen: boolean;
  ptoYearInput: string;
};

export function createAppPtoSectionShellProps({
  appState,
  models,
  navigation,
}: Pick<UseAppPtoScreenPropsArgs, "appState" | "models" | "navigation">): AppPtoSectionShellProps {
  return {
    ptoTab: appState.ptoTab,
    activePtoSubtabLabel: navigation.activePtoSubtab?.label ?? appState.ptoTab,
    activePtoSubtabContent: navigation.activePtoSubtab?.content || "",
    isPtoDateTab: models.isPtoDateTab,
    ptoAreaTabs: models.ptoAreaTabs,
    ptoAreaFilter: appState.ptoAreaFilter,
    ptoPlanRows: appState.ptoPlanRows,
    ptoOperRows: appState.ptoOperRows,
    ptoSurveyRows: appState.ptoSurveyRows,
    setPtoPlanRows: appState.setPtoPlanRows,
    setPtoOperRows: appState.setPtoOperRows,
    setPtoSurveyRows: appState.setPtoSurveyRows,
    selectPtoArea: appState.selectPtoArea,
    ptoPlanYear: appState.ptoPlanYear,
    reportDate: appState.reportDate,
    ptoYearMonths: models.ptoYearMonths,
    ptoMonthGroups: models.ptoMonthGroups,
    ptoYearTabs: models.ptoYearTabs,
    ptoYearDialogOpen: appState.ptoYearDialogOpen,
    ptoYearInput: appState.ptoYearInput,
  };
}
