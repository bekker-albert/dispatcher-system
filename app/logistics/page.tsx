import type { Metadata } from "next";
import ServerLogisticsWorkspace from "@/features/logistics/ServerLogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Серверная система заявок, согласований, рейсов, документов и аудита",
};

export default function LogisticsPage() {
  return <ServerLogisticsWorkspace />;
}
