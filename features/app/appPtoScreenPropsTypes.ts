import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppPtoDateEditing } from "@/features/app/useAppPtoDateEditing";
import type { useAppPtoDateModel } from "@/features/app/useAppPtoDateModel";
import type { useAppPtoDateViewport } from "@/features/app/useAppPtoDateViewport";
import type { useAppPtoSupplementalTables } from "@/features/app/useAppPtoSupplementalTables";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

export type AppPtoModels = ReturnType<typeof useAppDerivedModels> & ReturnType<typeof useAppPtoDateModel>;
export type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
export type AppNavigation = ReturnType<typeof useAppActiveNavigation>;
export type AppPtoDateViewport = ReturnType<typeof useAppPtoDateViewport>;
export type AppPtoDateEditing = ReturnType<typeof useAppPtoDateEditing>;
export type AppPtoSupplementalTables = ReturnType<typeof useAppPtoSupplementalTables>;

export type UseAppPtoScreenPropsArgs = {
  appState: AppStateBundle;
  models: AppPtoModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
  ptoDateViewport: AppPtoDateViewport;
  ptoDateEditing: AppPtoDateEditing;
  ptoSupplementalTables: AppPtoSupplementalTables;
};
