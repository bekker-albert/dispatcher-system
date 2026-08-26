"use client";

import type { ReactNode } from "react";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { PlanFactWorkspaceTabs } from "./PlanFactWorkspaceTabs";
import { usePlanFactWorkspaceController } from "./usePlanFactWorkspaceController";

type PlanFactWorkspaceShellProps = {
  appState: AppStateBundle;
  children: ReactNode;
};

export function PlanFactWorkspaceShell({ appState, children }: PlanFactWorkspaceShellProps) {
  const workspace = usePlanFactWorkspaceController(appState);

  return (
    <>
      <PlanFactWorkspaceTabs {...workspace} />
      {children}
    </>
  );
}
