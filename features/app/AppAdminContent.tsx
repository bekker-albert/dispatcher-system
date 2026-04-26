"use client";

import type { ComponentProps } from "react";

import { AdminAiSection } from "@/features/admin/ai/AdminAiSection";
import { AdminStructureSection } from "@/features/admin/structure/AdminStructureSection";
import {
  AdminDatabaseSection,
  AdminLogsSection,
  AdminNavigationSection,
  AdminReportSettingsSection,
  AdminVehiclesSection,
} from "@/features/app/lazySections";
import type { AdminSection } from "@/lib/domain/admin/navigation";
import { SectionCard } from "@/shared/ui/layout";

type AppAdminContentProps = {
  adminSection: AdminSection;
  navigationProps: ComponentProps<typeof AdminNavigationSection>;
  structureProps: ComponentProps<typeof AdminStructureSection>;
  vehiclesProps: ComponentProps<typeof AdminVehiclesSection>;
  databaseProps: ComponentProps<typeof AdminDatabaseSection>;
  logsProps: ComponentProps<typeof AdminLogsSection>;
  reportsProps: ComponentProps<typeof AdminReportSettingsSection>;
};

export function AppAdminContent({
  adminSection,
  navigationProps,
  structureProps,
  vehiclesProps,
  databaseProps,
  logsProps,
  reportsProps,
}: AppAdminContentProps) {
  return (
    <SectionCard title="">
      {adminSection === "navigation" && <AdminNavigationSection {...navigationProps} />}
      {adminSection === "structure" && <AdminStructureSection {...structureProps} />}
      {adminSection === "ai" && <AdminAiSection />}
      {adminSection === "vehicles" && <AdminVehiclesSection {...vehiclesProps} />}
      {adminSection === "database" && <AdminDatabaseSection {...databaseProps} />}
      {adminSection === "logs" && <AdminLogsSection {...logsProps} />}
      {adminSection === "reports" && <AdminReportSettingsSection {...reportsProps} />}
    </SectionCard>
  );
}
