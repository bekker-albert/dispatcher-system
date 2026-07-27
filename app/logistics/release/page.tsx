import type { Metadata } from "next";
import ReleaseWorkspace from "@/features/logistics/ReleaseWorkspace";

export const metadata: Metadata = {
  title: "Выпуск рейсов · Логистика Газели",
  description: "Медицинский и технический выпуск рейсов",
};

export default function LogisticsReleasePage() {
  return <ReleaseWorkspace />;
}
