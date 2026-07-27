import type { Metadata } from "next";
import ServerLogisticsWorkspace from "@/features/logistics/ServerLogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Серверная система заявок, согласований, рейсов и документов",
};

export default function LogisticsPage() {
  return <ServerLogisticsWorkspace />;
}
