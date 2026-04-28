"use client";

import type { useAppActiveNavigation } from "@/features/app/useAppActiveNavigation";
import type { useAppDerivedModels } from "@/features/app/useAppDerivedModels";
import type { useAppRuntimeControllers } from "@/features/app/useAppRuntimeControllers";
import type { AppStateBundle } from "@/features/app/AppStateBundle";

export type AppDerivedModels = ReturnType<typeof useAppDerivedModels>;
export type AppRuntimeControllers = ReturnType<typeof useAppRuntimeControllers>;
export type AppNavigation = ReturnType<typeof useAppActiveNavigation>;

export type AppPrimaryContentProps = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};
