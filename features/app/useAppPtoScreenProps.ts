"use client";

import type { PtoSectionProps } from "@/features/pto/PtoSection";
import { createAppPtoBucketSectionProps } from "@/features/app/appPtoBucketSectionProps";
import { createAppPtoDateRendererOptions } from "@/features/app/appPtoDateRendererOptions";
import { createAppPtoSectionShellProps } from "@/features/app/appPtoSectionShellProps";
import type { UseAppPtoScreenPropsArgs } from "@/features/app/appPtoScreenPropsTypes";
import { useAppPtoSectionProps } from "@/features/app/useAppPtoSectionProps";

export function useAppPtoScreenProps({
  appState,
  models,
  runtime,
  navigation,
  ptoDateViewport,
  ptoDateEditing,
  ptoSupplementalTables,
}: UseAppPtoScreenPropsArgs): PtoSectionProps {
  const ptoSectionShellProps = createAppPtoSectionShellProps({ appState, models, navigation });
  const ptoBucketSectionProps = createAppPtoBucketSectionProps({ appState, ptoSupplementalTables });
  const ptoDateRendererOptions = createAppPtoDateRendererOptions({
    appState,
    models,
    runtime,
    ptoDateViewport,
    ptoDateEditing,
    ptoSupplementalTables,
  });

  return useAppPtoSectionProps({
    ...ptoSectionShellProps,
    ...ptoBucketSectionProps,
    ...ptoDateRendererOptions,
  });
}
