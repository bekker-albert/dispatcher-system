"use client";

import type { AppPrimaryContentProps } from "@/features/app/AppPrimaryContentTypes";
import { useAppAdminScreenProps } from "@/features/app/useAppAdminScreenProps";

type AdminPrimaryContentProps = Pick<
  AppPrimaryContentProps,
  "appState" | "models" | "runtime"
>;

export function AdminPrimaryContent({
  appState,
  models,
  runtime,
}: AdminPrimaryContentProps) {
  const adminContent = useAppAdminScreenProps({
    appState,
    models,
    runtime,
  });

  return <>{adminContent}</>;
}
