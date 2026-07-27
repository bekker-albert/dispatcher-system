import type { Metadata } from "next";
import LogisticsWorkspace from "@/features/logistics/LogisticsWorkspace";

export const metadata: Metadata = {
  title: "Логистика Газели",
  description: "Веб-система заявок, согласований, командировок и документов",
};

export default function LogisticsPage() {
  return <LogisticsWorkspace />;
}
