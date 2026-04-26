"use client";

import type { ComponentProps, ReactNode } from "react";

import { ContractorsSection } from "@/features/contractors/ContractorsSection";
import { FleetSection } from "@/features/fleet/FleetSection";
import { FuelSection } from "@/features/fuel/FuelSection";
import { CustomTabSection } from "@/features/navigation/CustomTabSection";
import { PtoDatabaseGate } from "@/features/pto/PtoDatabaseGate";
import { SafetySection } from "@/features/safety-driving/SafetySection";
import { UserProfileSection } from "@/features/users/UserProfileSection";
import {
  DispatchSection,
  PtoSection,
  ReportsSection,
} from "@/features/app/lazySections";

type AppPrimaryContentProps = {
  renderedTopTab: string;
  shouldGatePtoDatabase: boolean;
  ptoDatabaseMessage: string;
  reportsProps: ComponentProps<typeof ReportsSection>;
  dispatchProps: ComponentProps<typeof DispatchSection>;
  fleetProps: ComponentProps<typeof FleetSection>;
  contractorsProps: ComponentProps<typeof ContractorsSection>;
  fuelProps: ComponentProps<typeof FuelSection>;
  ptoProps: ComponentProps<typeof PtoSection>;
  safetyProps: ComponentProps<typeof SafetySection>;
  userProfileProps: ComponentProps<typeof UserProfileSection>;
  adminContent: ReactNode;
  customTabProps: ComponentProps<typeof CustomTabSection> | null;
};

export function AppPrimaryContent({
  renderedTopTab,
  shouldGatePtoDatabase,
  ptoDatabaseMessage,
  reportsProps,
  dispatchProps,
  fleetProps,
  contractorsProps,
  fuelProps,
  ptoProps,
  safetyProps,
  userProfileProps,
  adminContent,
  customTabProps,
}: AppPrimaryContentProps) {
  const ptoGate = <PtoDatabaseGate message={ptoDatabaseMessage} />;

  return (
    <>
      {renderedTopTab === "reports" && (
        shouldGatePtoDatabase ? ptoGate : <ReportsSection {...reportsProps} />
      )}

      {renderedTopTab === "dispatch" && <DispatchSection {...dispatchProps} />}
      {renderedTopTab === "fleet" && <FleetSection {...fleetProps} />}
      {renderedTopTab === "contractors" && <ContractorsSection {...contractorsProps} />}
      {renderedTopTab === "fuel" && <FuelSection {...fuelProps} />}

      {renderedTopTab === "pto" && (
        shouldGatePtoDatabase ? ptoGate : <PtoSection {...ptoProps} />
      )}

      {renderedTopTab === "tb" && <SafetySection {...safetyProps} />}
      {renderedTopTab === "user" && <UserProfileSection {...userProfileProps} />}
      {renderedTopTab === "admin" && adminContent}
      {customTabProps && <CustomTabSection {...customTabProps} />}
    </>
  );
}
