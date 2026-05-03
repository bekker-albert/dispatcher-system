"use client";

import dynamic from "next/dynamic";

export const AdminPrimaryContent = dynamic(
  () => import("./AdminPrimaryContent").then((module) => module.AdminPrimaryContent),
  { ssr: false },
);

export const DispatchPrimaryContent = dynamic(
  () => import("./DispatchPrimaryContent").then((module) => module.DispatchPrimaryContent),
  { ssr: false },
);

export const PtoPrimaryContent = dynamic(
  () => import("./PtoPrimaryContent").then((module) => module.PtoPrimaryContent),
  { ssr: false },
);

export const ReportsPrimaryContent = dynamic(
  () => import("./ReportsPrimaryContent").then((module) => module.ReportsPrimaryContent),
  { ssr: false },
);

export const FleetPrimaryContent = dynamic(
  () => import("./VehicleTablePrimaryContent").then((module) => module.VehicleTablePrimaryContent),
  { ssr: false },
);

export const ContractorsPrimaryContent = dynamic(
  () => import("../contractors/ContractorsSection").then((module) => module.ContractorsSection),
  { ssr: false },
);

export const FuelPrimaryContent = dynamic(
  () => import("../fuel/FuelSection").then((module) => module.FuelSection),
  { ssr: false },
);

export const SafetyPrimaryContent = dynamic(
  () => import("../safety-driving/SafetySection").then((module) => module.SafetySection),
  { ssr: false },
);

export const UserPrimaryContent = dynamic(
  async () => {
    const [
      { UserProfileSection },
      { defaultUserCard },
    ] = await Promise.all([
      import("../users/UserProfileSection"),
      import("../../lib/domain/reference/defaults"),
    ]);

    return function UserPrimaryContent() {
      return <UserProfileSection userCard={defaultUserCard} />;
    };
  },
  { ssr: false },
);

export const CustomTabPrimaryContent = dynamic(
  () => import("../navigation/CustomTabSection").then((module) => module.CustomTabSection),
  { ssr: false },
);
