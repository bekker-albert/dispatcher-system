"use client";

import type { ReactNode } from "react";
import type { AppStateBundle } from "@/features/app/AppStateBundle";
import { isPtoDateTableKey } from "@/lib/domain/pto/date-table";
import { PlanFactWorkspaceTabs } from "./PlanFactWorkspaceTabs";
import { usePlanFactWorkspaceController } from "./usePlanFactWorkspaceController";

type PlanFactWorkspaceShellProps = {
  appState: AppStateBundle;
  children: ReactNode;
};

export function PlanFactWorkspaceShell({ appState, children }: PlanFactWorkspaceShellProps) {
  const workspace = usePlanFactWorkspaceController(appState);
  const mode = appState.topTab === "pto" ? "pto" : "reports";

  return (
    <>
      <PlanFactWorkspaceTabs
        {...workspace}
        mode={mode}
        activePtoTab={appState.ptoTab}
        onSelectPtoTab={(tab) => {
          appState.setTopTab("pto");
          appState.setPtoTab(tab);
          appState.setPtoDateEditing(isPtoDateTableKey(tab) ? appState.planFactEditing : false);
        }}
      />
      {children}
    </>
  );
}
