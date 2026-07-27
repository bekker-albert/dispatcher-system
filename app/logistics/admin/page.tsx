import type { Metadata } from "next";
import AdvancedAdminWorkspace from "@/features/logistics/AdvancedAdminWorkspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Расширенное администрирование · Логистика Газели",
  description: "Конструктор структуры, прав, согласований, документов и уведомлений",
};

export default function LogisticsAdminPage() {
  return <AdvancedAdminWorkspace />;
}
