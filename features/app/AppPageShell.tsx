"use client";

import type { ReactNode } from "react";

import { AiAssistantFloatingDockHost } from "@/features/app/AiAssistantFloatingDockHost";
import { AuthSessionButton } from "@/features/auth/AuthSessionButton";
import { reportPrintCss } from "@/features/reports/printCss";
import { SaveStatusIndicator, type SaveStatusState } from "@/shared/ui/SaveStatusIndicator";

type AppPageShellProps = {
  saveStatus: SaveStatusState;
  onCloseSaveStatus: () => void;
  children: ReactNode;
};

const appRootStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px",
  fontFamily: "var(--app-font)",
  color: "#0f172a",
  lineHeight: 1.35,
};

const appShellStyle = {
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
};

export function AppPageShell({
  saveStatus,
  onCloseSaveStatus,
  children,
}: AppPageShellProps) {
  return (
    <div className="app-print-root" style={appRootStyle}>
      <style>{`${reportPrintCss}\n@media print { .app-save-status, .ai-floating-dock, .app-auth-session { display: none !important; } }`}</style>
      <AuthSessionButton />
      <SaveStatusIndicator status={saveStatus} onClose={onCloseSaveStatus} />
      <div className="app-print-shell" style={appShellStyle}>
        {children}
      </div>
      <AiAssistantFloatingDockHost />
    </div>
  );
}
