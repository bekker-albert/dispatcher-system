import type { Metadata } from "next";

import AdvancedAdminWorkspace from "@/features/logistics/AdvancedAdminWorkspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Конструктор системы · Логистика Газели",
  description: "Расширенные настройки структуры, форм, процессов и прав",
};

export default function LogisticsConstructorPage() {
  return <AdvancedAdminWorkspace />;
}
