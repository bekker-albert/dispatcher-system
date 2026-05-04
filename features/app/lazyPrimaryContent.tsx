"use client";

import dynamic from "next/dynamic";

function PrimaryContentLoading({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "24px 0",
        color: "#64748b",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      Загрузка раздела «{label}»...
    </div>
  );
}

export const AdminPrimaryContent = dynamic(
  () => import("./AdminPrimaryContent").then((module) => module.AdminPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Админка" />,
  },
);

export const AiAssistantPrimaryContent = dynamic(
  () => import("./AiAssistantPrimaryContent").then((module) => module.AiAssistantPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="AI-ассистент" />,
  },
);

export const DispatchPrimaryContent = dynamic(
  () => import("./DispatchPrimaryContent").then((module) => module.DispatchPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Диспетчер" />,
  },
);

export const PtoPrimaryContent = dynamic(
  () => import("./PtoPrimaryContent").then((module) => module.PtoPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="ПТО" />,
  },
);

export const ReportsPrimaryContent = dynamic(
  () => import("./ReportsPrimaryContent").then((module) => module.ReportsPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Отчеты" />,
  },
);

export const FleetPrimaryContent = dynamic(
  () => import("./FleetPrimaryContent").then((module) => module.FleetPrimaryContent),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Автопарк" />,
  },
);

export const ContractorsPrimaryContent = dynamic(
  () => import("../contractors/ContractorsSection").then((module) => module.ContractorsSection),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Подрядчики" />,
  },
);

export const FuelPrimaryContent = dynamic(
  () => import("../fuel/FuelSection").then((module) => module.FuelSection),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="ГСМ" />,
  },
);

export const SafetyPrimaryContent = dynamic(
  () => import("../safety-driving/SafetySection").then((module) => module.SafetySection),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="ТБ" />,
  },
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
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Профиль" />,
  },
);

export const CustomTabPrimaryContent = dynamic(
  () => import("../navigation/CustomTabSection").then((module) => module.CustomTabSection),
  {
    ssr: false,
    loading: () => <PrimaryContentLoading label="Дополнительная вкладка" />,
  },
);
