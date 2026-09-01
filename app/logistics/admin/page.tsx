import type { Metadata } from "next";

import LogisticsSettingsHome from "@/features/logistics/LogisticsSettingsHome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Настройки · Логистика Газели",
  description: "Учётная запись, документы, выпуск и конструктор системы",
};

export default function LogisticsAdminPage() {
  return <LogisticsSettingsHome />;
}
