"use client";

import type { AppStateBundle } from "@/features/app/AppStateBundle";
import type {
  AppDerivedModels,
  AppNavigation,
  AppRuntimeControllers,
} from "@/features/app/appScreenPropsTypes";

export type {
  AppDerivedModels,
  AppNavigation,
  AppRuntimeControllers,
} from "@/features/app/appScreenPropsTypes";

export type AppPrimaryContentProps = {
  appState: AppStateBundle;
  models: AppDerivedModels;
  runtime: AppRuntimeControllers;
  navigation: AppNavigation;
};
