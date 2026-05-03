import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppDispatchSummaryModel } from "@/features/app/useAppDispatchSummaryModel";
import type { useAppReportsModel } from "@/features/app/useAppReportsModel";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

export type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
export type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
export type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
export type AppReportsModel = ReturnType<typeof useAppReportsModel>;
export type AppDispatchModels = AppDerivedModels & ReturnType<typeof useAppDispatchSummaryModel>;

export type AppReportsScreenState = Pick<
  AppStateBundle,
  | "reportArea"
  | "setReportArea"
  | "reportReasons"
  | "reportDate"
>;

export type AppDispatchScreenState = Pick<
  AppStateBundle,
  | "dispatchTab"
  | "reportDate"
  | "search"
  | "setSearch"
  | "areaFilter"
  | "setAreaFilter"
  | "dispatchVehicleToAddId"
  | "setDispatchVehicleToAddId"
>;

export type AppScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};
